import * as XLSX from 'xlsx';
import { VenteLigne } from '../types';

export class FileExportService {
  
  // Générer un nom de fichier avec date et heure
  private genererNomFichier(): string {
    const maintenant = new Date();
    const date = maintenant.toISOString().slice(0, 10); // YYYY-MM-DD
    const heure = maintenant.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    
    return `ventes_decomposees_${date}_${heure}.xlsx`;
  }

  // Exporter les ventes décomposées en Excel
  async exporterVentesDecomposees(ventes: VenteLigne[]): Promise<void> {
    try {
      // Préparer les données pour l'export
      const donneesExport = ventes.map(vente => ({
        'Date': vente.date,
        'Heure': vente.heure,
        'Boutique': vente.boutique,
        'ID': vente.id,
        'Produit': vente.produit,
        'Déclinaison': vente.declinaison,
        'Qté': vente.qte,
        'Prix TTC': vente.prix_ttc,
        'Prix Achat': vente.prix_achat,
        'Montant TTC': vente.montant_ttc,
        'TVA': vente.tva,
        'Remise TTC': vente.remise_ttc,
        'Caissier': vente.caissier,
        'Commande': vente.commande,
        'Retour': vente.retour,
        'Fournisseur': vente.fournisseur,
        'Fabricant': vente.fabricant,
        'Catégorie': vente.categorie,
        'Paiement': vente.paiement,
        'Client': vente.client,
        'EAN': vente.ean,
        'Référence': vente.reference
      }));

      // Créer le workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(donneesExport);

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Heure
        { wch: 15 }, // Boutique
        { wch: 8 },  // ID
        { wch: 30 }, // Produit
        { wch: 15 }, // Déclinaison
        { wch: 6 },  // Qté
        { wch: 12 }, // Prix TTC
        { wch: 12 }, // Prix Achat
        { wch: 12 }, // Montant TTC
        { wch: 10 }, // TVA
        { wch: 12 }, // Remise TTC
        { wch: 15 }, // Caissier
        { wch: 12 }, // Commande
        { wch: 8 },  // Retour
        { wch: 20 }, // Fournisseur
        { wch: 20 }, // Fabricant
        { wch: 20 }, // Catégorie
        { wch: 15 }, // Paiement
        { wch: 20 }, // Client
        { wch: 15 }, // EAN
        { wch: 20 }  // Référence
      ];
      worksheet['!cols'] = colWidths;

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventes Décomposées');

      // Générer le nom de fichier
      const nomFichier = this.genererNomFichier();

      // Exporter le fichier
      XLSX.writeFile(workbook, nomFichier);

      console.log(`✅ Fichier exporté: ${nomFichier}`);
      console.log(`📊 ${ventes.length} lignes exportées`);

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      throw new Error('Erreur lors de l\'export du fichier');
    }
  }

  // Exporter les statistiques
  async exporterStatistiques(statistiques: any): Promise<void> {
    try {
      const nomFichier = `statistiques_ventes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(statistiques);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques');
      XLSX.writeFile(workbook, nomFichier);

      console.log(`✅ Statistiques exportées: ${nomFichier}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des statistiques:', error);
      throw new Error('Erreur lors de l\'export des statistiques');
    }
  }
}

export default FileExportService;


