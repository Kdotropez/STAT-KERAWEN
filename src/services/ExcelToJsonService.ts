import * as XLSX from 'xlsx';
import { VenteLigne } from '../types';
import UnclassifiedProductsManager from './UnclassifiedProductsManager';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any[];
  headers: string[];
}

export interface JsonVenteData {
  headers: string[];
  data: any[];
  metadata: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export class ExcelToJsonService {
  private unclassifiedManager: UnclassifiedProductsManager;

  constructor() {
    this.unclassifiedManager = new UnclassifiedProductsManager();
  }
  
  /**
   * Convertit un fichier Excel en JSON avec validation
   */
  async convertExcelToJson(file: File): Promise<JsonVenteData> {
    console.log('🔄 Début de la conversion Excel → JSON...');
    
    try {
      // 1. Lire le fichier Excel
      const excelData = await this.readExcelFile(file);
      console.log(`📊 Fichier Excel lu: ${excelData.length} lignes`);
      
      // 2. Extraire les en-têtes
      const headers = this.extractHeaders(excelData);
      console.log('📋 En-têtes détectés:', headers);
      
      // 3. Valider la structure
      const validation = this.validateStructure(headers, excelData);
      console.log('✅ Validation terminée:', validation);
      
      // 4. Convertir en format JSON structuré
      const jsonData = this.convertToStructuredJson(headers, excelData, validation);
      
      return jsonData;
      
    } catch (error) {
      console.error('❌ Erreur lors de la conversion:', error);
      throw new Error(`Erreur de conversion: ${error}`);
    }
  }
  
  /**
   * Lit le fichier Excel et retourne les données brutes
   */
  private async readExcelFile(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as any[][]);
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Extrait les en-têtes de la première ligne
   */
  private extractHeaders(data: any[][]): string[] {
    if (!data || data.length === 0) {
      throw new Error('Fichier Excel vide');
    }
    
    const firstRow = data[0];
    return firstRow.map((header: any) => String(header || '').trim());
  }
  
  /**
   * Valide la structure du fichier
   */
  private validateStructure(headers: string[], data: any[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Colonnes obligatoires
    const requiredColumns = ['Date', 'ID', 'Produit', 'Qté', 'Montant TTC'];
    const requiredColumnIndices: { [key: string]: number } = {};
    
    // Vérifier les colonnes obligatoires
    for (const requiredCol of requiredColumns) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(requiredCol.toLowerCase()) ||
        h.toLowerCase().includes(requiredCol.toLowerCase().replace(' ', ''))
      );
      
      if (index === -1) {
        errors.push(`Colonne obligatoire manquante: ${requiredCol}`);
      } else {
        requiredColumnIndices[requiredCol] = index;
        console.log(`✅ Colonne trouvée: ${requiredCol} → index ${index}`);
      }
    }
    
    // Vérifier les données
    let validRows = 0;
    let invalidRows = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let rowValid = true;
      
      // Vérifier que la ligne n'est pas vide
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue;
      }
      
      // Vérifier les valeurs obligatoires
      for (const [colName, colIndex] of Object.entries(requiredColumnIndices)) {
        const value = row[colIndex];
        
        if (value === null || value === undefined || value === '') {
          // Si c'est l'ID qui manque, vérifier si c'est un service
          if (colName === 'ID') {
            const produitValue = row[requiredColumnIndices['Produit']];
            const nomProduit = String(produitValue || '').toLowerCase();
            
            if (nomProduit.includes('frais de port') || 
                nomProduit.includes('livraison') || 
                nomProduit.includes('transport') || 
                nomProduit.includes('service')) {
              console.log(`🏷️ Service sans ID détecté: "${produitValue}" - ligne ${i + 1}`);
              // Ne pas marquer comme invalide pour les services
              continue;
            }
          }
          
          warnings.push(`Ligne ${i + 1}: Valeur manquante pour ${colName}`);
          rowValid = false;
        }
      }
      
      if (rowValid) {
        validRows++;
      } else {
        invalidRows++;
      }
    }
    
    console.log(`📊 Validation: ${validRows} lignes valides, ${invalidRows} lignes avec problèmes`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data,
      headers
    };
  }
  
  /**
   * Convertit les données en format JSON structuré
   */
  private convertToStructuredJson(headers: string[], data: any[][], validation: ValidationResult): JsonVenteData {
    const structuredData = [];
    let startDate = null;
    let endDate = null;
    
    // Traiter les lignes de données (à partir de la ligne 2)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Ignorer les lignes vides
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue;
      }
      
      // Créer un objet structuré
      const rowObject: any = {};
      
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Nettoyer et formater les valeurs
        if (value !== null && value !== undefined && value !== '') {
          rowObject[header] = this.cleanValue(value);
        }
      });
      
      // Extraire la date pour les métadonnées
      if (rowObject.Date) {
        const date = new Date(rowObject.Date);
        if (!isNaN(date.getTime())) {
          if (!startDate || date < startDate) startDate = date;
          if (!endDate || date > endDate) endDate = date;
        }
      }
      
      structuredData.push(rowObject);
    }
    
    return {
      headers,
      data: structuredData,
      metadata: {
        totalRows: data.length - 1,
        validRows: structuredData.length,
        invalidRows: validation.warnings.length,
        dateRange: {
          start: startDate ? startDate.toISOString().split('T')[0] : '',
          end: endDate ? endDate.toISOString().split('T')[0] : ''
        }
      }
    };
  }
  
  /**
   * Nettoie et formate une valeur
   */
  private cleanValue(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  }
  
  /**
   * Analyse les produits sans ID dans les données converties
   */
  analyzeUnclassifiedProducts(jsonData: JsonVenteData): any {
    // Convertir les données JSON en format VenteLigne pour l'analyse
    const ventes: VenteLigne[] = jsonData.data.map((row: any) => ({
      id: row.ID || row.id || '',
      nom: row.Produit || row.produit || row.Nom || row.nom || '',
      produit: row.Produit || row.produit || row.Nom || row.nom || '',
      quantite: Number(row.Quantite || row.quantite || row.Qte || row.qte || 1),
      prix_ttc: Number(row.Prix || row.prix || row['Prix TTC'] || row['prix_ttc'] || 0),
      montantTTC: Number(row.Montant || row.montant || row['Montant TTC'] || row['montant_ttc'] || 0),
      date: row.Date || row.date || new Date().toISOString().split('T')[0],
      boutique: row.Boutique || row.boutique || row.Magasin || row.magasin || 'Inconnue',
      categorie: row.Categorie || row.categorie || '',
      type: 'Original'
    }));

    return {
      unclassifiedProducts: this.unclassifiedManager.analyzeUnclassifiedProducts(ventes),
      stats: this.unclassifiedManager.getUnclassifiedStats(),
      rules: this.unclassifiedManager.getClassificationRules()
    };
  }

  /**
   * Applique les règles de classification aux données converties
   */
  applyClassificationRules(jsonData: JsonVenteData): JsonVenteData {
    // Convertir les données JSON en format VenteLigne
    const ventes: VenteLigne[] = jsonData.data.map((row: any) => ({
      id: row.ID || row.id || '',
      nom: row.Produit || row.produit || row.Nom || row.nom || '',
      produit: row.Produit || row.produit || row.Nom || row.nom || '',
      quantite: Number(row.Quantite || row.quantite || row.Qte || row.qte || 1),
      prix_ttc: Number(row.Prix || row.prix || row['Prix TTC'] || row['prix_ttc'] || 0),
      montantTTC: Number(row.Montant || row.montant || row['Montant TTC'] || row['montant_ttc'] || 0),
      date: row.Date || row.date || new Date().toISOString().split('T')[0],
      boutique: row.Boutique || row.boutique || row.Magasin || row.magasin || 'Inconnue',
      categorie: row.Categorie || row.categorie || '',
      type: 'Original'
    }));

    // Appliquer les règles de classification
    const ventesModifiees = this.unclassifiedManager.applyClassificationRules(ventes);

    // Reconvertir en format JSON
    const dataModifiee = ventesModifiees.map(vente => ({
      ID: vente.id,
      Produit: vente.produit,
      Quantite: vente.quantite,
      'Prix TTC': vente.prix_ttc,
      'Montant TTC': vente.montantTTC,
      Date: vente.date,
      Boutique: vente.boutique,
      Categorie: vente.categorie,
      Type: vente.type
    }));

    return {
      ...jsonData,
      data: dataModifiee
    };
  }

  /**
   * Sauvegarde les données JSON
   */
  async saveJsonData(jsonData: JsonVenteData, filename: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.[^/.]+$/, '')}_converted.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Fichier JSON sauvegardé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }
}

export default ExcelToJsonService;
