import { VenteLigne } from '../types';

export interface MergeResult {
  success: boolean;
  ventesExistant: number;
  ventesNouvelles: number;
  ventesFusionnees: number;
  doublonsElimines: number;
  doublonsInternes?: {
    total: number;
    details: Array<{
      date: string;
      produit: string;
      boutique: string;
      quantite: number;
      montant: number;
      occurrences: number;
    }>;
  };
  message: string;
  periode: { debut: Date; fin: Date };
  fichiersSauvegardes: { mois: string; fusionne: string };
}

export interface MonthlyData {
  mois: string; // Format: "2024-01"
  ventes: VenteLigne[];
  dateImport: Date;
  stats: {
    totalVentes: number;
    totalCA: number;
    compositions: number;
    composants: number;
  };
}

export interface SauvegardeConfig {
  dossierBase: string;
  organiserParAnnee: boolean;
  organiserParMois: boolean;
  nommageAutomatique: boolean;
}

export class MonthlyMergeService {
  private readonly STORAGE_KEY = 'ventes_mensuelles_cumulatives';
  private readonly STORAGE_KEY_METADATA = 'ventes_mensuelles_metadata';
  private readonly STORAGE_KEY_FICHIERS = 'ventes_mensuelles_fichiers';
  private readonly STORAGE_KEY_CONFIG = 'ventes_mensuelles_config';

  private config: SauvegardeConfig = {
    dossierBase: 'Ventes-Mensuelles',
    organiserParAnnee: true,
    organiserParMois: true,
    nommageAutomatique: true
  };

  constructor() {
    this.chargerConfiguration();
  }

  /**
   * Charge la configuration de sauvegarde
   */
  private chargerConfiguration(): void {
    try {
      const configData = localStorage.getItem(this.STORAGE_KEY_CONFIG);
      if (configData) {
        this.config = { ...this.config, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la configuration:', error);
    }
  }

  /**
   * Sauvegarde la configuration
   */
  private sauvegarderConfiguration(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la configuration:', error);
    }
  }

  /**
   * Met à jour la configuration de sauvegarde
   */
  mettreAJourConfiguration(nouvelleConfig: Partial<SauvegardeConfig>): void {
    this.config = { ...this.config, ...nouvelleConfig };
    this.sauvegarderConfiguration();
    console.log('⚙️ Configuration mise à jour:', this.config);
  }

  /**
   * Obtient la configuration actuelle
   */
  obtenirConfiguration(): SauvegardeConfig {
    return { ...this.config };
  }

  /**
   * Détecte les doublons internes dans le fichier importé
   */
  detecterDoublonsInternes(ventes: VenteLigne[]): {
    total: number;
    details: Array<{
      date: string;
      produit: string;
      boutique: string;
      quantite: number;
      montant: number;
      occurrences: number;
    }>;
  } {
    const doublonsMap = new Map<string, number>();
    const detailsMap = new Map<string, {
      date: string;
      produit: string;
      boutique: string;
      quantite: number;
      montant: number;
      occurrences: number;
    }>();

    // Compter les occurrences de chaque vente
    ventes.forEach(vente => {
      const cle = this.creerCleUnique(vente);
      const count = doublonsMap.get(cle) || 0;
      doublonsMap.set(cle, count + 1);
      
      if (count === 0) {
        // Première occurrence, sauvegarder les détails
        detailsMap.set(cle, {
          date: new Date(vente.date).toLocaleDateString('fr-FR'),
          produit: vente.produit || '',
          boutique: vente.boutique || '',
          quantite: vente.quantite || 0,
          montant: vente.montantTTC || 0,
          occurrences: 1
        });
      } else {
        // Mise à jour du nombre d'occurrences
        const details = detailsMap.get(cle);
        if (details) {
          details.occurrences = count + 1;
        }
      }
    });

    // Filtrer seulement les doublons (occurrences > 1)
    const doublons = Array.from(detailsMap.values()).filter(d => d.occurrences > 1);
    const total = doublons.reduce((sum, d) => sum + (d.occurrences - 1), 0);

    return {
      total,
      details: doublons
    };
  }

  /**
   * Génère le chemin de sauvegarde selon la configuration
   */
  private genererCheminSauvegarde(mois: string, dateExport: string): string {
    const [annee, moisNum] = mois.split('-');
    
    let chemin = this.config.dossierBase;
    
    if (this.config.organiserParAnnee) {
      chemin += `/${annee}`;
    }
    
    if (this.config.organiserParMois) {
      const moisNoms = [
        '01-Janvier', '02-Fevrier', '03-Mars', '04-Avril', '05-Mai', '06-Juin',
        '07-Juillet', '08-Aout', '09-Septembre', '10-Octobre', '11-Novembre', '12-Decembre'
      ];
      chemin += `/${moisNoms[parseInt(moisNum) - 1]}`;
    }
    
    return chemin;
  }

  /**
   * Génère le nom de fichier selon la configuration
   */
  private genererNomFichier(type: 'mois' | 'fusionne', mois?: string, dateExport?: string): string {
    const date = dateExport || new Date().toISOString().split('T')[0];
    
    if (type === 'mois' && mois) {
      return `ventes-${mois}-${date}.json`;
    } else {
      return `ventes-cumulatives-${date}.json`;
    }
  }

  /**
   * Fusionne les nouvelles ventes avec les ventes existantes
   */
  async fusionnerVentesMensuelles(nouvellesVentes: VenteLigne[], supprimerDoublons: boolean = false): Promise<MergeResult> {
    try {
      console.log('🔄 Début de la fusion mensuelle...');
      
      // Charger les ventes existantes
      const ventesExistantes = this.chargerVentesExistantes();
      console.log(`📊 Ventes existantes: ${ventesExistantes.length}`);
      
      // Analyser les nouvelles ventes
      const analyseNouvelles = this.analyserVentes(nouvellesVentes);
      console.log(`📊 Nouvelles ventes: ${nouvellesVentes.length}`);
      console.log(`📅 Période des nouvelles ventes: ${analyseNouvelles.debut.toLocaleDateString()} - ${analyseNouvelles.fin.toLocaleDateString()}`);
      
      // Détecter les doublons internes dans le fichier importé
      const doublonsInternes = this.detecterDoublonsInternes(nouvellesVentes);
      console.log(`🔍 Doublons internes détectés: ${doublonsInternes.total}`);
      
      // Fusionner selon le choix de l'utilisateur
      const { ventesFusionnees, doublonsElimines } = this.fusionnerAvecChoix(ventesExistantes, nouvellesVentes, supprimerDoublons);
      
      // Sauvegarder les ventes fusionnées
      this.sauvegarderVentes(ventesFusionnees);
      
      // Mettre à jour les métadonnées
      this.mettreAJourMetadonnees(analyseNouvelles);
      
      // Sauvegarder les fichiers JSON
      const fichiersSauvegardes = await this.sauvegarderFichiersJSON(nouvellesVentes, ventesFusionnees, analyseNouvelles);
      
      const result: MergeResult = {
        success: true,
        ventesExistant: ventesExistantes.length,
        ventesNouvelles: nouvellesVentes.length,
        ventesFusionnees: ventesFusionnees.length,
        doublonsElimines,
        doublonsInternes: doublonsInternes.total > 0 ? doublonsInternes : undefined,
        message: `Fusion réussie : ${nouvellesVentes.length} nouvelles ventes ajoutées (${doublonsElimines} doublons éliminés). Fichiers sauvegardés dans ${this.config.dossierBase}.`,
        periode: {
          debut: analyseNouvelles.debut,
          fin: analyseNouvelles.fin
        },
        fichiersSauvegardes
      };
      
      console.log('✅ Fusion mensuelle terminée:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur lors de la fusion mensuelle:', error);
      return {
        success: false,
        ventesExistant: 0,
        ventesNouvelles: nouvellesVentes.length,
        ventesFusionnees: 0,
        doublonsElimines: 0,
        message: `Erreur de fusion : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        periode: { debut: new Date(), fin: new Date() },
        fichiersSauvegardes: { mois: '', fusionne: '' }
      };
    }
  }

  /**
   * Fusionne les ventes en respectant le choix de l'utilisateur pour les doublons
   */
  private fusionnerAvecChoix(existantes: VenteLigne[], nouvelles: VenteLigne[], supprimerDoublons: boolean): { ventesFusionnees: VenteLigne[]; doublonsElimines: number } {
    if (supprimerDoublons) {
      // Utiliser la logique existante pour supprimer les doublons
      return this.fusionnerSansDoublons(existantes, nouvelles);
    } else {
      // Ajouter toutes les nouvelles ventes sans vérification de doublons
      const ventesFusionnees = [...existantes, ...nouvelles];
      return { ventesFusionnees, doublonsElimines: 0 };
    }
  }

  /**
   * Sauvegarde les fichiers JSON (mois individuel + fusionné)
   */
  private async sauvegarderFichiersJSON(
    nouvellesVentes: VenteLigne[], 
    ventesFusionnees: VenteLigne[], 
    analyse: { debut: Date; fin: Date; mois: string[] }
  ): Promise<{ mois: string; fusionne: string }> {
    try {
      const dateExport = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fichiersSauvegardes: { mois: string; fusionne: string } = { mois: '', fusionne: '' };
      
      // 1. Sauvegarder le fichier du mois individuel
      if (analyse.mois.length > 0) {
        const moisPrincipal = analyse.mois[0]; // Prendre le premier mois
        const cheminMois = this.genererCheminSauvegarde(moisPrincipal, dateExport);
        const nomFichierMois = this.genererNomFichier('mois', moisPrincipal, dateExport);
        const cheminCompletMois = `${cheminMois}/${nomFichierMois}`;
        
        const dataMois = {
          metadata: {
            mois: moisPrincipal,
            dateExport,
            totalVentes: nouvellesVentes.length,
            periode: {
              debut: analyse.debut.toISOString(),
              fin: analyse.fin.toISOString()
            },
            chemin: cheminCompletMois
          },
          ventes: nouvellesVentes
        };
        
        this.downloaderFichier(dataMois, nomFichierMois);
        fichiersSauvegardes.mois = cheminCompletMois;
        console.log(`💾 Fichier mois sauvegardé: ${cheminCompletMois}`);
      }
      
      // 2. Sauvegarder le fichier fusionné complet
      const cheminFusionne = this.genererCheminSauvegarde('cumulatives', dateExport);
      const nomFichierFusionne = this.genererNomFichier('fusionne', undefined, dateExport);
      const cheminCompletFusionne = `${cheminFusionne}/${nomFichierFusionne}`;
      
      const dataFusionne = {
        metadata: {
          dateExport,
          totalVentes: ventesFusionnees.length,
          periode: {
            debut: analyse.debut.toISOString(),
            fin: analyse.fin.toISOString()
          },
          mois: analyse.mois,
          derniereMiseAJour: new Date().toISOString(),
          chemin: cheminCompletFusionne
        },
        ventes: ventesFusionnees
      };
      
      this.downloaderFichier(dataFusionne, nomFichierFusionne);
      fichiersSauvegardes.fusionne = cheminCompletFusionne;
      console.log(`💾 Fichier fusionné sauvegardé: ${cheminCompletFusionne}`);
      
      // 3. Sauvegarder la liste des fichiers dans localStorage
      this.sauvegarderListeFichiers(fichiersSauvegardes);
      
      return fichiersSauvegardes;
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des fichiers JSON:', error);
      throw error;
    }
  }

  /**
   * Télécharge un fichier JSON
   */
  private downloaderFichier(data: any, nomFichier: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sauvegarde la liste des fichiers dans localStorage
   */
  private sauvegarderListeFichiers(nouveauxFichiers: { mois: string; fusionne: string }): void {
    try {
      const listeExistante = this.chargerListeFichiers();
      listeExistante.push({
        ...nouveauxFichiers,
        dateSauvegarde: new Date().toISOString(),
        config: { ...this.config }
      });
      
      localStorage.setItem(this.STORAGE_KEY_FICHIERS, JSON.stringify(listeExistante));
      console.log('📋 Liste des fichiers mise à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la liste des fichiers:', error);
    }
  }

  /**
   * Charge la liste des fichiers sauvegardés
   */
  private chargerListeFichiers(): Array<{ mois: string; fusionne: string; dateSauvegarde: string; config?: SauvegardeConfig }> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_FICHIERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la liste des fichiers:', error);
      return [];
    }
  }

  /**
   * Obtient la liste des fichiers sauvegardés
   */
  obtenirListeFichiers(): Array<{ mois: string; fusionne: string; dateSauvegarde: string; config?: SauvegardeConfig }> {
    return this.chargerListeFichiers();
  }

  /**
   * Restaure les données depuis un fichier JSON
   */
  async restaurerDepuisFichier(file: File): Promise<{ success: boolean; message: string; ventes: VenteLigne[] }> {
    try {
      const contenu = await this.lireFichier(file);
      const data = JSON.parse(contenu);
      
      if (!data.ventes || !Array.isArray(data.ventes)) {
        return {
          success: false,
          message: 'Format de fichier invalide : pas de données de ventes trouvées',
          ventes: []
        };
      }
      
      // Convertir les dates string en objets Date
      const ventes = data.ventes.map((vente: any) => ({
        ...vente,
        date: new Date(vente.date)
      }));
      
      return {
        success: true,
        message: `Restauration réussie : ${ventes.length} ventes chargées`,
        ventes
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la restauration : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        ventes: []
      };
    }
  }

  /**
   * Lit le contenu d'un fichier
   */
  private lireFichier(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }

  /**
   * Charge les ventes existantes depuis le localStorage
   */
  private chargerVentesExistantes(): VenteLigne[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const ventes = JSON.parse(data) as VenteLigne[];
        // Convertir les dates string en objets Date
        return ventes.map(vente => ({
          ...vente,
          date: new Date(vente.date)
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement des ventes existantes:', error);
      return [];
    }
  }

  /**
   * Analyse les ventes pour déterminer la période
   */
  private analyserVentes(ventes: VenteLigne[]): { debut: Date; fin: Date; mois: string[] } {
    if (ventes.length === 0) {
      return { debut: new Date(), fin: new Date(), mois: [] };
    }

    const dates = ventes.map(v => new Date(v.date)).filter(d => !isNaN(d.getTime()));
    const debut = new Date(Math.min(...dates.map(d => d.getTime())));
    const fin = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Extraire les mois uniques
    const moisSet = new Set(dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`));
    const mois = Array.from(moisSet);
    
    return { debut, fin, mois };
  }

  /**
   * Fusionne les ventes en éliminant les doublons
   */
  private fusionnerSansDoublons(existantes: VenteLigne[], nouvelles: VenteLigne[]): { ventesFusionnees: VenteLigne[]; doublonsElimines: number } {
    let doublonsElimines = 0;
    const ventesFusionnees = [...existantes];
    
    // Créer un Set des clés uniques des ventes existantes pour une recherche rapide
    const clesExistantes = new Set<string>();
    existantes.forEach(vente => {
      const cle = this.creerCleUnique(vente);
      clesExistantes.add(cle);
    });
    
    // Ajouter les nouvelles ventes qui ne sont pas des doublons
    nouvelles.forEach(vente => {
      const cle = this.creerCleUnique(vente);
      if (!clesExistantes.has(cle)) {
        ventesFusionnees.push(vente);
        clesExistantes.add(cle);
      } else {
        doublonsElimines++;
        console.log(`🔍 Doublon éliminé: ${vente.produit} - ${vente.date} - ${vente.boutique}`);
      }
    });
    
    return { ventesFusionnees, doublonsElimines };
  }

  /**
   * Crée une clé unique pour identifier une vente
   */
  private creerCleUnique(vente: VenteLigne): string {
    // Clé basée sur les propriétés essentielles pour détecter les doublons
    const date = new Date(vente.date).toISOString().split('T')[0]; // YYYY-MM-DD
    const id = vente.id || 'SANS_ID';
    const produit = vente.produit || '';
    const boutique = vente.boutique || '';
    const quantite = vente.quantite || 0;
    // Utiliser le montant exact sans arrondi pour éviter les faux doublons
    const montant = vente.montantTTC || 0;
    
    return `${date}|${id}|${produit}|${boutique}|${quantite}|${montant}`;
  }

  /**
   * Sauvegarde les ventes fusionnées dans le localStorage
   */
  private sauvegarderVentes(ventes: VenteLigne[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ventes));
      console.log(`💾 ${ventes.length} ventes sauvegardées dans le localStorage`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des ventes:', error);
      throw error;
    }
  }

  /**
   * Met à jour les métadonnées des imports mensuels
   */
  private mettreAJourMetadonnees(analyse: { debut: Date; fin: Date; mois: string[] }): void {
    try {
      const metadata = this.chargerMetadonnees();
      
      // Ajouter les nouveaux mois
      analyse.mois.forEach(mois => {
        if (!metadata.mois.includes(mois)) {
          metadata.mois.push(mois);
        }
      });
      
      // Mettre à jour la période globale
      if (metadata.debut === null || analyse.debut < metadata.debut) {
        metadata.debut = analyse.debut;
      }
      if (metadata.fin === null || analyse.fin > metadata.fin) {
        metadata.fin = analyse.fin;
      }
      
      metadata.derniereMiseAJour = new Date();
      
      localStorage.setItem(this.STORAGE_KEY_METADATA, JSON.stringify(metadata));
      console.log('📊 Métadonnées mises à jour');
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des métadonnées:', error);
    }
  }

  /**
   * Charge les métadonnées des imports mensuels
   */
  private chargerMetadonnees(): { mois: string[]; debut: Date | null; fin: Date | null; derniereMiseAJour: Date | null } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_METADATA);
      if (data) {
        const metadata = JSON.parse(data);
        return {
          mois: metadata.mois || [],
          debut: metadata.debut ? new Date(metadata.debut) : null,
          fin: metadata.fin ? new Date(metadata.fin) : null,
          derniereMiseAJour: metadata.derniereMiseAJour ? new Date(metadata.derniereMiseAJour) : null
        };
      }
      return { mois: [], debut: null, fin: null, derniereMiseAJour: null };
    } catch (error) {
      console.error('❌ Erreur lors du chargement des métadonnées:', error);
      return { mois: [], debut: null, fin: null, derniereMiseAJour: null };
    }
  }

  /**
   * Obtient les statistiques des ventes cumulatives
   */
  obtenirStatistiquesCumulatives(): { totalVentes: number; periode: { debut: Date | null; fin: Date | null }; mois: string[] } {
    const ventes = this.chargerVentesExistantes();
    const metadata = this.chargerMetadonnees();
    
    return {
      totalVentes: ventes.length,
      periode: {
        debut: metadata.debut,
        fin: metadata.fin
      },
      mois: metadata.mois.sort()
    };
  }

  /**
   * Efface toutes les données cumulatives
   */
  effacerDonneesCumulatives(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY_METADATA);
    localStorage.removeItem(this.STORAGE_KEY_FICHIERS);
    localStorage.removeItem(this.STORAGE_KEY_CONFIG);
    console.log('🗑️ Données cumulatives effacées');
  }

  /**
   * Exporte les données cumulatives
   */
  exporterDonneesCumulatives(): { ventes: VenteLigne[]; metadata: any } {
    const ventes = this.chargerVentesExistantes();
    const metadata = this.chargerMetadonnees();
    
    return {
      ventes,
      metadata: {
        ...metadata,
        exportDate: new Date(),
        totalVentes: ventes.length
      }
    };
  }
}
