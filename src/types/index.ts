// Types essentiels pour l'application

export interface VenteLigne {
  id: string;
  nom: string;
  quantite: number;
  montantTTC: number;
  date: string | Date;
  boutique: string;
  categorie?: string;
  composants?: ComposantVendu[];
  type?: 'Original' | 'Decompose' | 'Composé' | 'Cumulé';
  operationId?: string;
  client?: string;
  commande?: string;
  retour?: boolean;
  prixUnitaire?: number;
  tva?: number;
  remise?: number;
  prixAchat?: number;
  fournisseur?: string;
  fabricant?: string;
  ean?: string;
  reference?: string;
  pays?: string;
  paiement?: string;
  mode?: string;
  tag?: string;
  note?: string;
  heure?: string;
  activite?: string;
  caisse?: string;
  caissier?: string;
  groupe?: string;
  declinaison?: string;
  livreur?: string;
  mesure?: string;
  produit: string;
  prix_ttc: number;
  prix_achat?: number;
  montant_ttc?: number;
  remise_ttc?: number;
  remiseTTC?: number;
  qte?: number;
  numeroOperation?: string;
  marge?: number;
  specifications?: string;
}

export interface ComposantVendu {
  id: string;
  nom: string;
  quantite: number;
  prix?: number;
  categorie?: string;
  prixUnitaire?: number;
  marge?: number;
}

export interface Composition {
  id: string;
  nom: string;
  type: 'vasque' | 'pack' | 'trio';
  composants: Composant[];
  isModified?: boolean;
  nombreComposants?: number;
  compositions?: string[];
}

export interface Composant {
  id: string;
  nom: string;
  quantite: number;
  categorie?: string;
  prix?: number;
}

export interface CompositionsData {
  vasque: Composition[];
  pack: Composition[];
  trio: Composition[];
  compositions?: Composition[];
}

export interface MappingColonnes {
  [key: string]: string | undefined;
}
