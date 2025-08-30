# Script PowerShell pour formater les fichiers Excel de vente
# Compatible avec l'application de statistiques

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ""
)

# Vérifier si le fichier existe
if (-not (Test-Path $FilePath)) {
    Write-Error "Le fichier $FilePath n'existe pas!"
    exit 1
}

# Si aucun chemin de sortie spécifié, utiliser le même dossier
if ($OutputPath -eq "") {
    $OutputPath = [System.IO.Path]::ChangeExtension($FilePath, ".formatted.xlsx")
}

try {
    # Créer une instance Excel
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    Write-Host "Ouverture du fichier Excel..." -ForegroundColor Green
    $workbook = $excel.Workbooks.Open($FilePath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    # Trouver la dernière ligne avec des données
    $lastRow = $worksheet.Cells($worksheet.Rows.Count, 1).End(-4162).Row
    Write-Host "Dernière ligne trouvée: $lastRow" -ForegroundColor Yellow
    
    # Vérifier s'il y a des données
    if ($lastRow -lt 2) {
        Write-Error "Aucune donnée trouvée dans la colonne A!"
        exit 1
    }
    
    # 1. Insérer les en-têtes si nécessaire
    $firstCellValue = $worksheet.Cells(1, 1).Text
    if ($firstCellValue -eq "" -or $firstCellValue -match '^\d+$') {
        Write-Host "Insertion des en-têtes..." -ForegroundColor Green
        $worksheet.Rows(1).Insert()
        $lastRow++
        
        # Ajouter les en-têtes
        $headers = @(
            "Date", "Heure", "Activité", "Boutique", "Caisse", "Caissier", "Commande", "Retour",
            "Client", "Groupe", "Id", "Produit", "Déclinaison", "Ean", "Fournisseur", "Fabriquant",
            "Prix unitaire TTC", "Qté", "Mesure", "Montant TTC", "Prix TTC", "TVA", "Remise TTC", "Prix d'achat"
        )
        
        for ($i = 0; $i -lt $headers.Length; $i++) {
            $worksheet.Cells(1, $i + 1) = $headers[$i]
        }
        
        # Formater les en-têtes
        $headerRange = $worksheet.Range("A1:X1")
        $headerRange.Font.Bold = $true
        $headerRange.Interior.Color = 12632256  # Gris clair
    }
    
    # 2. Formater les dates (colonne A)
    Write-Host "Formatage des dates..." -ForegroundColor Green
    $dateRange = $worksheet.Range("A2:A$lastRow")
    $dateRange.NumberFormat = "dd/mm/yyyy"
    
    # 3. Formater les prix (colonnes U et X) - en centimes
    Write-Host "Formatage des prix..." -ForegroundColor Green
    for ($row = 2; $row -le $lastRow; $row++) {
        # Prix TTC (colonne U)
        $prixTTC = $worksheet.Cells($row, 21).Value
        if ($prixTTC -ne $null -and $prixTTC -ne "") {
            if ($prixTTC -lt 1000) {  # Probablement en euros
                $worksheet.Cells($row, 21).Value = $prixTTC * 100
            }
            $worksheet.Cells($row, 21).NumberFormat = "0"
        }
        
        # Prix d'achat (colonne X)
        $prixAchat = $worksheet.Cells($row, 24).Value
        if ($prixAchat -ne $null -and $prixAchat -ne "") {
            if ($prixAchat -lt 1000) {  # Probablement en euros
                $worksheet.Cells($row, 24).Value = $prixAchat * 100
            }
            $worksheet.Cells($row, 24).NumberFormat = "0"
        }
    }
    
    # 4. Calculer le montant TTC si nécessaire (colonne T)
    Write-Host "Calcul des montants..." -ForegroundColor Green
    for ($row = 2; $row -le $lastRow; $row++) {
        $montant = $worksheet.Cells($row, 20).Value
        if ($montant -eq $null -or $montant -eq 0 -or $montant -eq "") {
            $qte = $worksheet.Cells($row, 18).Value
            $prixTTC = $worksheet.Cells($row, 21).Value
            if ($qte -ne $null -and $prixTTC -ne $null) {
                $worksheet.Cells($row, 20).Value = $qte * $prixTTC
                $worksheet.Cells($row, 20).NumberFormat = "0"
            }
        }
    }
    
    # 5. Nettoyer les données
    Write-Host "Nettoyage des données..." -ForegroundColor Green
    for ($row = 2; $row -le $lastRow; $row++) {
        for ($col = 1; $col -le 24; $col++) {
            $cellValue = $worksheet.Cells($row, $col).Text
            if ($cellValue -ne "") {
                $worksheet.Cells($row, $col).Value = $cellValue.Trim()
            }
        }
    }
    
    # 6. Formater le tableau
    Write-Host "Formatage du tableau..." -ForegroundColor Green
    $dataRange = $worksheet.Range("A1:X$lastRow")
    $dataRange.Borders.LineStyle = 1  # xlContinuous
    $dataRange.AutoFit()
    
    # 7. Sauvegarder
    Write-Host "Sauvegarde du fichier..." -ForegroundColor Green
    $workbook.SaveAs($OutputPath)
    
    # 8. Fermer Excel
    $workbook.Close($true)
    $excel.Quit()
    
    # Libérer les ressources
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($worksheet) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    
    Write-Host "✅ Fichier formaté avec succès!" -ForegroundColor Green
    Write-Host "📁 Fichier de sortie: $OutputPath" -ForegroundColor Cyan
    Write-Host "📊 Lignes traitées: $($lastRow - 1)" -ForegroundColor Yellow
    Write-Host "📋 Colonnes: A à X (24 colonnes)" -ForegroundColor Yellow
    
} catch {
    Write-Error "Erreur lors du traitement: $($_.Exception.Message)"
    exit 1
}


