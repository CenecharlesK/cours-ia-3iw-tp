// =============================================================
//  Zéphyr — base de connaissances (réponses instantanées)
//  Pour ajouter une réponse : ajoutez un objet { id, cat, si, reponse }.
//   - cat : catégorie du classifieur (voir classifieur.js)
//   - si  : expression (ou liste d'expressions, toutes requises) testée
//           sur le texte normalisé (minuscules, sans accents)
//   - sauf (facultatif) : expression qui exclut l'intention
//  Les intentions sont testées dans l'ordre : mettez les plus précises en premier.
// =============================================================

export const NUMERO_URGENCE = '112';
export const INFO_AEROPORT = 'comptoir information du Terminal 1 (ouvert 24h/24)';

// Consignes ajoutées en tête de réponse quand l'urgence est haute
export const PRIORITAIRE = {
  securite: `🚨 Urgence : appelez immédiatement le ${NUMERO_URGENCE} (gratuit) ou alertez l’agent de l’aéroport le plus proche.`,
  perturbation: '⚠ Demande prioritaire : présentez-vous dès maintenant au hall central, où les agents des compagnies gèrent les réacheminements.',
  enregistrement: '⚠ Demande prioritaire : signalez-vous tout de suite à un agent en indiquant l’heure de votre vol, les départs imminents sont traités en priorité.',
  objet_perdu: '⚠ Demande prioritaire : prévenez immédiatement l’agent le plus proche (sûreté ou porte d’embarquement) en décrivant l’objet et l’endroit.',
  bagage: '⚠ Demande prioritaire : signalez-vous immédiatement à un agent au comptoir de votre compagnie, les vols imminents passent en priorité.',
  assistance: '⚠ Demande prioritaire : prévenez l’agent à la porte d’embarquement ou appelez l’assistance PMR au 01 23 45 67 89.',
  defaut: '⚠ Demande prioritaire : adressez-vous tout de suite à l’agent le plus proche ou au comptoir information du Terminal 1.'
};

// Départs utilisés si le site n'envoie pas de contexte (identiques à index.html)
export const DEPARTS_DEFAUT = [
  ['06:10', 'EM 412', 'Lisbonne', 'T2', 'E12', 'À l’heure'],
  ['06:45', 'EM 118', 'Madrid', 'T1', 'B04', 'À l’heure'],
  ['07:20', 'EM 904', 'Montréal', 'T2', 'E21', 'Retard 40 min'],
  ['07:55', 'EM 233', 'Dubaï', 'T2', 'E08', 'Embarquement'],
  ['08:30', 'EM 551', 'Rome', 'T1', 'B11', 'Annulé'],
  ['09:05', 'EM 760', 'Dakar', 'T2', 'E15', 'À l’heure'],
  ['10:20', 'EM 006', 'New York', 'T2', 'E30', 'À l’heure'],
  ['11:40', 'EM 272', 'Tokyo', 'T2', 'E33', 'À l’heure'],
  ['13:15', 'EM 318', 'Singapour', 'T2', 'E27', 'Retard 15 min'],
  ['15:50', 'EM 640', 'La Réunion', 'T2', 'E19', 'À l’heure'],
  ['18:30', 'EM 088', 'Los Angeles', 'T2', 'E24', 'À l’heure'],
  ['22:45', 'EM 196', 'Sydney', 'T2', 'E35', 'À l’heure']
];

export const INTENTIONS = [
  // ---------------- Sécurité ----------------
  { id: 'enfant_perdu', cat: 'securite', si: /\b(enfant|fils|fille|bebe|petit|petite)\b/,
    reponse: 'Restez où vous êtes et prévenez immédiatement un agent : une alerte « enfant égaré » est diffusée à toutes les équipes et les accès sont surveillés. Donnez son prénom, son âge, ses vêtements et l’endroit où vous l’avez vu pour la dernière fois.' },
  { id: 'urgence_medicale', cat: 'securite', si: /\b(malaise|mal|evanoui\w*|inconscient\w*|crise|epilep\w*|respire|saign\w*|blesse\w*|tombee?|medic\w*|medecin|ambulance|contraction\w*|accouch\w*|anaphylactique|connaissance|poitrine|fracture\w*)\b/,
    reponse: `Appelez le ${NUMERO_URGENCE} et prévenez l’agent le plus proche : le service médical de l’aéroport intervient dans tous les terminaux et des défibrillateurs sont signalés près des portes. Restez auprès de la personne, ne lui donnez rien à boire si elle est inconsciente et suivez les consignes des secours.` },
  { id: 'objet_abandonne', cat: 'securite', si: /\b(abandonne\w*|suspect\w*|sans surveillance)\b/,
    reponse: 'Ne touchez pas l’objet et ne le déplacez pas. Éloignez-vous et éloignez les personnes autour, puis prévenez immédiatement un agent de sûreté ou la police aux frontières, ou appelez le 112. Indiquez l’emplacement exact et depuis combien de temps l’objet est seul.' },
  { id: 'incendie', cat: 'securite', si: /\b(feu|incendie|fumee|flammes?|explosion|alarme)\b/,
    reponse: 'Éloignez-vous de la zone, ne prenez pas les ascenseurs et suivez les panneaux de sortie de secours et les consignes des agents. Appelez le 112 ou actionnez le déclencheur d’alarme le plus proche si l’alerte n’est pas déjà donnée.' },
  { id: 'vol_objet', cat: 'securite', si: /\bvole\w*|pickpocket|cambriol/,
    reponse: 'Faites opposition tout de suite à vos cartes bancaires si elles ont été prises, puis déposez plainte au poste de police de l’aéroport (Terminal 1, niveau 0). Si des papiers d’identité ont été volés, la déclaration de vol vous servira pour voyager et refaire vos documents.' },
  { id: 'agression', cat: 'securite', si: /\b(bagarre|battent|agress\w*|violen\w*|menace\w*|frapp\w*|harcel\w*|arme|couteau|pistolet|terroris\w*|attentat)\b/,
    reponse: 'Mettez-vous à l’abri, ne vous interposez pas et prévenez immédiatement un agent de sûreté ou la police de l’aéroport (112). Si les faits sont passés, vous pouvez déposer plainte au poste de police du Terminal 1, niveau 0, et signaler l’incident au service relations clients.' },

  // ---------------- Perturbations ----------------
  { id: 'vol_annule', cat: 'perturbation', si: /\b(annule|annulee|annulation|supprime)\b/,
    reponse: 'Votre compagnie doit vous proposer, au choix, un réacheminement vers votre destination ou le remboursement du billet. Adressez-vous aux agents du hall central ou à votre compagnie, et gardez votre carte d’embarquement et vos justificatifs. Pour un vol au départ de l’Union européenne, le règlement CE 261/2004 prévoit aussi une prise en charge (repas, hôtel si besoin) et, selon les cas, une indemnisation de 250 à 600 €.' },
  { id: 'correspondance', cat: 'perturbation', si: /\b(correspondance|transit|escale)\b/,
    reponse: 'Dès la sortie de l’avion, suivez les panneaux « Correspondances » et présentez-vous au comptoir transfert : si vos vols sont sur la même réservation, la compagnie doit vous replacer sur le prochain vol sans frais. Prévenez aussi l’équipage avant l’atterrissage, il peut demander à vous faire descendre en priorité.' },
  { id: 'vol_manque', cat: 'perturbation', si: /\b(rate|rater|manque|manquer|loupe|louper)\b/,
    reponse: 'Allez directement au comptoir de votre compagnie ou au hall central : selon votre tarif, vous pourrez être placé sur le vol suivant, parfois avec des frais. Si le retard vient d’un premier vol sur la même réservation, le réacheminement est gratuit.' },
  { id: 'surbooking', cat: 'perturbation', si: /\b(surbook\w*|surreservation|refuse|refus)\b/,
    reponse: 'Un refus d’embarquement pour surréservation vous donne droit à un réacheminement ou au remboursement, à une prise en charge (repas, hôtel) et à une indemnisation de 250 à 600 € selon la distance (règlement CE 261/2004). Demandez une attestation écrite à l’agent de la porte.' },
  { id: 'deroute', cat: 'perturbation', si: /\bderout\w*/,
    reponse: 'En cas de déroutement, la compagnie doit organiser votre acheminement jusqu’à l’aéroport prévu (bus, train ou autre vol). Restez avec le groupe et suivez les consignes de l’équipage et des agents au sol.' },
  { id: 'greve', cat: 'perturbation', si: /\bgreve\w*/,
    reponse: 'En période de grève, consultez la page « Départs » et les messages de votre compagnie avant de partir. Si votre vol est annulé, vous pouvez choisir entre un réacheminement et un remboursement.' },
  { id: 'indemnisation', cat: 'perturbation', si: /\b(indemni\w*|dedommag\w*|droits?|261)\b/, sauf: /\b(repas|manger|hotel|nuit)\b/,
    reponse: 'Pour un vol au départ de l’Union européenne, un retard de 3 h ou plus à l’arrivée ou une annulation tardive peut donner droit à 250 € (moins de 1 500 km), 400 € (1 500 à 3 500 km) ou 600 € (plus de 3 500 km), sauf circonstances extraordinaires (météo, sûreté). Faites la demande auprès de la compagnie avec votre carte d’embarquement.' },
  { id: 'retard_prise_en_charge', cat: 'perturbation', si: /\b(repas|manger|bon|hotel|nuit|boisson)\b/,
    reponse: 'À partir de 2 h de retard (vol de moins de 1 500 km), 3 h (1 500 à 3 500 km) ou 4 h (au-delà), la compagnie doit vous offrir repas et rafraîchissements, et une nuit d’hôtel si le départ est reporté au lendemain. Demandez vos bons aux agents de la compagnie au hall central.' },
  { id: 'horaire_modifie', cat: 'perturbation', si: /\b(avance|decale|reporte)\w*/,
    reponse: 'Quand la compagnie modifie l’horaire de votre vol, elle doit vous prévenir et vous proposer une solution si le nouvel horaire ne vous convient pas : autre vol ou remboursement. Contactez-la avec votre référence de réservation.' },
  { id: 'bloque', cat: 'perturbation', si: /\bbloquee?s?\b/,
    reponse: 'Allez au hall central : les agents des compagnies y proposent les réacheminements et, si vous devez passer la nuit sur place, les bons d’hôtel et de repas prévus par le règlement européen.' },
  { id: 'retard', cat: 'perturbation', si: /\bretard\w*/,
    reponse: 'Suivez l’heure prévue sur les écrans ou la page « Départs », et restez à proximité de la porte : un retard annoncé peut être réduit. À partir de 2 h de retard, la compagnie vous doit des repas, et au-delà de 3 h à l’arrivée vous pouvez avoir droit à une indemnisation.' },

  // ---------------- Bagages ----------------
  { id: 'bagage_endommage', cat: 'bagage', si: /\b(cassee?|abimee?|endommagee?|dechiree?|arrachee?|ouverte?|manque|trempee?|vole)\w*/,
    reponse: 'Avant de quitter la zone de livraison, faites constater les dégâts au comptoir litiges bagages : un rapport (PIR) est établi. Ensuite, vous avez 7 jours pour adresser votre réclamation écrite à la compagnie, avec photos, rapport et carte d’embarquement.' },
  { id: 'bagage_perdu', cat: 'bagage', si: /\b(pas sortie?|pas arrivee?|perdue?s?|retard\w*|manquante?|toujours pas|jamais arrivee?|egaree?)\b/,
    reponse: 'Déclarez-le au comptoir litiges bagages de la zone de livraison avant de sortir : un rapport (PIR) avec un numéro de dossier vous sera remis. Gardez le talon d’étiquette collé sur votre carte d’embarquement. La plupart des bagages sont retrouvés en 48 h et livrés à domicile ; vos achats de première nécessité peuvent être remboursés sur justificatifs.' },
  { id: 'objets_electriques', cat: 'bagage', si: /\b(trottinette|hoverboard|gyropode|batterie|power bank|electrique)\b/,
    reponse: 'Les batteries au lithium sont interdites en soute. En cabine, elles sont acceptées jusqu’à 100 Wh, et de 100 à 160 Wh avec l’accord de la compagnie. Les trottinettes et gyropodes électriques sont refusés par la plupart des compagnies : vérifiez auprès de la vôtre avant le départ.' },
  { id: 'liquides', cat: 'bagage', si: /\b(liquides?|ml|parfum|gel|creme|gourde|shampo\w*|boisson)\b/,
    reponse: 'En cabine, les liquides doivent être dans des contenants de 100 ml maximum, réunis dans un sac plastique transparent fermé d’un litre. Les médicaments et le lait pour bébé sont autorisés en quantité nécessaire. En soute, pas de limite de 100 ml.' },
  { id: 'equipement_special', cat: 'bagage', si: /\b(poussette|skis?|velo|planche|surf|golf|guitare|violon|instrument|siege auto)\b/,
    reponse: 'Poussettes et sièges auto voyagent gratuitement et peuvent être laissés à la porte de l’avion. Les skis, vélos et clubs de golf vont en soute dans une housse, souvent avec un supplément. Un petit instrument peut aller en cabine s’il respecte les dimensions ; sinon, il faut réserver un siège ou le mettre en soute dans un étui rigide.' },
  { id: 'bagage_cabine', cat: 'bagage', si: /\bcabine\b/,
    reponse: 'Le bagage cabine est inclus pour tous : 55×35×25 cm et 10 kg maximum. Un bagage cabine supplémentaire coûte 30 € aller-retour (tarif simulé).' },
  { id: 'consigne_bagage', cat: 'bagage', si: /\b(depot|deposer|tapis)\b/,
    reponse: 'Le dépôt bagage se fait au comptoir de votre compagnie ou aux bornes de dépôt automatique, en T1 comme en T2. Il ferme en général 45 minutes avant un vol européen et 60 minutes avant un vol international.' },
  { id: 'bagage_soute', cat: 'bagage', si: /\b(soute|franchise|supplement\w*|kg|kilos?|poids|excedent|combien|prix)\b/,
    reponse: 'En soute, chaque bagage pèse 23 kg maximum : 0 inclus en Économique, 1 en Premium Economy, 2 en Business. Chaque bagage supplémentaire coûte 60 € aller-retour (tarif simulé). Au-delà de 23 kg, prévoyez un supplément de surpoids ou répartissez vos affaires.' },

  // ---------------- Enregistrement ----------------
  { id: 'enreg_urgent', cat: 'enregistrement', urgence: 'haute', si: /./,
    reponse: '⚠ Ne restez pas dans la file : allez directement voir un agent ou le comptoir « Dernière minute » en montrant l’heure de votre vol, les départs imminents passent en priorité. Si vous êtes déjà enregistré en ligne et voyagez avec un seul bagage cabine, allez directement au contrôle de sûreté. Les comptoirs ferment 45 minutes avant un vol européen et 60 minutes avant un vol international.' },
  { id: 'enreg_probleme', cat: 'enregistrement', si: /\b(erreur|impossible|bug|n arrive pas|pas recu|ne (fonctionne|marche)|telecharger)\b/,
    reponse: 'Essayez depuis un autre navigateur ou depuis l’application, en vérifiant la référence de réservation et le nom exact du passager. Si cela ne fonctionne toujours pas, les bornes du T1 et du T2 impriment votre carte d’embarquement, et les agents au comptoir peuvent vous enregistrer.' },
  { id: 'annuler_enreg', cat: 'enregistrement', si: /\bannuler\b/,
    reponse: 'Vous pouvez annuler votre enregistrement depuis « Mes réservations » jusqu’à l’embarquement, ou au comptoir de la compagnie. Votre réservation reste valable.' },
  { id: 'enreg_heure_comptoir', cat: 'enregistrement', si: /\b(heure|ferme|ferment|ouvre|ouvrent)\b/,
    reponse: 'Les comptoirs ouvrent environ 3 h avant le départ et ferment 45 minutes avant un vol européen, 60 minutes avant un vol international. Présentez-vous 2 h avant en Europe et 3 h avant à l’international.' },
  { id: 'enreg_comptoir', cat: 'enregistrement', si: /\b(ou|comptoir|terminal|borne)\b/,
    reponse: 'Les vols Europe sont enregistrés au Terminal 1, les vols internationaux au Terminal 2. Le numéro de comptoir de votre vol s’affiche sur les écrans des départs, et des bornes automatiques sont disponibles dans les deux terminaux.' },
  { id: 'enreg_siege', cat: 'enregistrement', si: /\bsieges?\b/,
    reponse: 'Oui : pendant l’enregistrement, vous pouvez confirmer ou changer votre siège parmi les places encore libres. Les sièges standard sont gratuits ; les sièges Premium et d’issue de secours sont payants.' },
  { id: 'enreg_en_ligne', cat: 'enregistrement', si: /\b(enregistr\w*|checkin|carte d embarquement|en ligne)\b/,
    reponse: 'L’enregistrement en ligne ouvre 30 h avant le départ et ferme 1 h avant : munissez-vous de votre référence de réservation et du nom du passager, puis téléchargez ou imprimez votre carte d’embarquement. Les bébés sont enregistrés avec l’adulte qui les accompagne.' },

  // ---------------- Objets perdus ----------------
  { id: 'document_oublie', cat: 'objet_perdu', si: /\b(passeport|carte d identite|papiers|permis|titre de sejour)\b/,
    reponse: 'Sans pièce d’identité valide, l’embarquement sera refusé. Si vous l’avez laissée à un poste de contrôle ou à un comptoir, retournez-y immédiatement ou demandez à n’importe quel agent de prévenir le poste par radio. Si elle est restée chez vous, contactez votre compagnie pour décaler votre vol. En cas de perte définitive, faites une déclaration de perte au poste de police du Terminal 1.' },
  { id: 'objet_oublie_avion', cat: 'objet_perdu', si: /\b(avion|a bord|cabine|vol)\b/, sauf: /\bvol (part|est) dans\b/,
    reponse: 'Un objet oublié à bord est récupéré par l’équipe de la compagnie. Déclarez-le au comptoir de la compagnie ou aux objets trouvés (Terminal 1, niveau 0) avec votre numéro de vol, votre siège et une description précise.' },
  { id: 'objets_trouves', cat: 'objet_perdu', si: /./,
    reponse: 'Le service des objets trouvés est au Terminal 1, niveau 0. Indiquez une description précise (couleur, marque, signes distinctifs), le lieu et l’heure approximative. Les objets sont conservés plusieurs semaines ; pour une pièce d’identité, faites aussi une déclaration de perte.' },

  // ---------------- Facturation ----------------
  { id: 'double_debit', cat: 'facturation', si: /\b(deux fois|en double|double|inconnu|non autorise|frauduleu\w*)\b/,
    reponse: 'Vérifiez d’abord sur votre relevé s’il s’agit d’une pré-autorisation (elle disparaît en quelques jours). Sinon, envoyez au service client votre référence de réservation et une capture du relevé : le montant en trop est remboursé sur la même carte, en général sous 7 à 14 jours. Rappel : ce site est une démonstration, aucun paiement réel n’y est effectué.' },
  { id: 'paiement_refuse', cat: 'facturation', si: /\b(refusee?|carte bancaire)\b/,
    reponse: 'Vérifiez le plafond de votre carte, la date d’expiration et la validation 3-D Secure de votre banque, puis réessayez. Dans cette démonstration, utilisez la carte de test 4242 4242 4242 4242.' },
  { id: 'remboursement', cat: 'facturation', si: /\brembours\w*/,
    reponse: 'Un remboursement est versé sur le moyen de paiement d’origine, en général sous 7 jours après acceptation, parfois jusqu’à 30 jours selon la banque. Sans nouvelles, relancez le service client avec votre référence de dossier.' },
  { id: 'facture_erreur', cat: 'facturation', si: /\b(ne correspond|a tort|alors qu|erreur|trop)\b/,
    reponse: 'Envoyez au service client votre référence de réservation, le montant attendu et le montant facturé : après vérification, la différence est remboursée. Dans ce site de démonstration, tous les prix sont simulés.' },
  { id: 'facture', cat: 'facturation', si: /\b(factur\w*|recu|justificatif|note de frais)\b/,
    reponse: 'Vous pouvez télécharger votre facture depuis « Mes réservations », ou la demander au service client avec votre référence. Pour le parking, la facture est disponible à la caisse du P1/P2 ou sur demande avec le ticket. Indiquez le nom de votre entreprise si besoin.' },
  { id: 'paiement_moyens', cat: 'facturation', si: /./,
    reponse: 'Le paiement se fait par carte bancaire. Dans cette démonstration, aucun paiement réel n’est effectué : utilisez la carte de test 4242 4242 4242 4242.' },

  // ---------------- Réservation ----------------
  { id: 'nom_errone', cat: 'reservation', si: /\b(mal orthographi\w*|erreur|faute|nom)\b/,
    reponse: 'Une petite faute (une ou deux lettres) se corrige en général gratuitement : contactez la compagnie avec votre référence et une copie de votre pièce d’identité, avant l’enregistrement. Un changement complet de nom n’est en revanche pas autorisé.' },
  { id: 'annuler_resa', cat: 'reservation', si: /\bannuler\b/,
    reponse: 'Allez dans « Mes réservations », retrouvez votre dossier avec la référence et le nom, puis choisissez « Annuler ma réservation ». Le remboursement dépend des conditions du tarif ; les taxes d’aéroport sont toujours remboursables. Ici, toutes les réservations sont fictives.' },
  { id: 'modifier_resa', cat: 'reservation', si: /\b(modifier|changer|decaler|reporter)\b/,
    reponse: 'Ouvrez « Mes réservations », puis « Modifier ma réservation » : vous pouvez changer la date, l’horaire ou le passager selon les conditions de votre tarif. Une différence de prix peut s’appliquer.' },
  { id: 'siege', cat: 'reservation', si: /\b(sieges?|hublot|couloir|place)\b/,
    reponse: 'Vous choisissez vos sièges à l’étape 3 de la réservation, sur le plan ou dans la vue 3D. En Économique : standard gratuit, Premium (3 premiers rangs) +35 € par trajet, issue de secours +45 € (adultes uniquement).' },
  { id: 'surclassement', cat: 'reservation', si: /\b(surclass\w*|business|premium)\b/,
    reponse: 'Vous pouvez passer en Premium Economy ou en Business en modifiant votre réservation (différence de tarif), ou demander un surclassement au comptoir le jour du départ s’il reste des places.' },
  { id: 'groupe', cat: 'reservation', si: /\bgroupe\b/,
    reponse: 'Le site permet de réserver jusqu’à 9 voyageurs à la fois. Au-delà, faites plusieurs réservations ou contactez le service groupes de la compagnie.' },
  { id: 'resa_probleme', cat: 'reservation', si: /\b(n arrive pas|impossible|erreur|bug|bloque)\b/,
    reponse: 'Vérifiez que tous les champs sont remplis (noms en lettres, date retour après l’aller, au moins un adulte) et que la case de simulation est cochée. Si le problème continue, rechargez la page et recommencez la recherche.' },
  { id: 'reserver', cat: 'reservation', si: /./,
    reponse: 'Utilisez la page « Réserver » : choisissez vos villes, dates, voyageurs et classe, puis votre vol, vos sièges et vos passagers. Les tarifs et le paiement sont simulés : aucun achat réel n’est effectué.' },

  // ---------------- Assistance ----------------
  { id: 'pmr_attente', cat: 'assistance', si: /\b(personne n est venu|attends? depuis|m attend|pas venu|oubli\w*)\b/,
    reponse: 'Signalez-vous à l’agent le plus proche ou appelez l’assistance PMR au 01 23 45 67 89 : un agent est envoyé en priorité. Si votre vol part bientôt, la porte d’embarquement est prévenue.' },
  { id: 'enceinte', cat: 'assistance', si: /\benceinte\b/,
    reponse: 'Jusqu’à 28 semaines, le voyage est en général libre. De 28 à 36 semaines, la plupart des compagnies demandent un certificat médical récent ; au-delà, l’embarquement est souvent refusé. Vérifiez les règles exactes de votre compagnie.' },
  { id: 'oxygene', cat: 'assistance', si: /\boxygene\b/,
    reponse: 'L’oxygène médical à bord doit être demandé à la compagnie au moins 48 h avant le vol, avec un certificat médical. Les concentrateurs portables agréés sont généralement acceptés en cabine.' },
  { id: 'chien_guide', cat: 'assistance', si: /\bchien\b/,
    reponse: 'Les chiens guides et d’assistance voyagent gratuitement en cabine, aux pieds de leur maître. Prévenez la compagnie au moins 48 h avant le départ.' },
  { id: 'pmr', cat: 'assistance', si: /./,
    reponse: 'L’assistance PMR est gratuite : un agent vous accompagne du dépôt-minute jusqu’à votre siège (fauteuil, aide à la marche, guidage pour les personnes malvoyantes ou malentendantes, accompagnement des handicaps invisibles). Réservez-la au moins 48 h avant le vol au 01 23 45 67 89.' },

  // ---------------- Accès ----------------
  { id: 'parking_probleme', cat: 'acces', si: /\b(barriere|ne (s ouvre|passe|fonctionne|marche)\w*|coince\w*|bloque\w*|ticket)\b/,
    reponse: 'Appuyez sur le bouton d’interphone de la borne ou de la barrière : un agent du parking répond 24h/24 et peut l’ouvrir à distance. Pour la navette P2, appelez le même interphone depuis l’abri.' },
  { id: 'parking', cat: 'acces', si: /\b(parkings?|garer|stationn\w*|p1|p2|depose minute)\b/,
    reponse: 'P1 court séjour : 4 €/h, au pied des terminaux, idéal pour déposer quelqu’un. P2 longue durée : 19 €/jour avec navette gratuite toutes les 10 minutes vers les terminaux.' },
  { id: 'taxi', cat: 'acces', si: /\b(taxis?|vtc|uber)\b/,
    reponse: 'Des taxis attendent devant chaque terminal, et la zone de prise en charge VTC est signalée au niveau des arrivées. Comptez environ 40 à 60 minutes depuis le centre selon la circulation.' },
  { id: 'location_voiture', cat: 'acces', si: /\b(location|loueur|louer)\b/,
    reponse: 'Les agences de location de voitures se trouvent au niveau des arrivées du Terminal 1, avec un retour des véhicules au parking P1.' },
  { id: 'transports', cat: 'acces', si: /./,
    reponse: 'Le tram ligne E relie le centre-ville toutes les 8 minutes, de 5 h à minuit. Des taxis attendent devant chaque terminal et la navette P2 passe toutes les 10 minutes.' },

  // ---------------- Services ----------------
  { id: 'wifi', cat: 'services', si: /\b(wifi|internet)\b/,
    reponse: 'Le Wi-Fi est gratuit et illimité dans les deux terminaux : choisissez le réseau « Emeraude-Free ». En cas de coupure, essayez de vous éloigner des portes E les plus fréquentées ou signalez-le au comptoir information.' },
  { id: 'salon', cat: 'services', si: /\b(salons?|lounge)\b/,
    reponse: 'Le Salon Feuille (Terminal 1) et le Salon Canopée (Terminal 2) sont accessibles pour 35 € sans carte ; ils sont inclus pour les passagers Business.' },
  { id: 'consigne', cat: 'services', si: /\bconsigne\b/,
    reponse: 'La consigne à bagages se trouve au Terminal 1, pour 9 € par jour et par bagage.' },
  { id: 'restauration', cat: 'services', si: /\b(restaurants?|manger|cafe|snack|vegetarien|halal)\b/,
    reponse: 'Les deux terminaux proposent cafés, restaurants et snacks avant et après la sûreté, avec des options végétariennes, halal et sans gluten. Les points de vente côté portes ouvrent dès le premier vol.' },
  { id: 'pharmacie', cat: 'services', si: /\bpharmacie\b/,
    reponse: 'Une pharmacie est ouverte au Terminal 1 (zone publique) et un point santé se trouve en zone d’embarquement du Terminal 2.' },
  { id: 'change', cat: 'services', si: /\b(change|devises|distributeurs?|dollars?)\b/,
    reponse: 'Un bureau de change et des distributeurs de billets se trouvent dans les deux terminaux, ouverts tous les jours. Les boutiques duty free acceptent les cartes bancaires et souvent les principales devises.' },
  { id: 'fumeur', cat: 'services', si: /\b(fumeurs?|cigarette)\b/,
    reponse: 'Il est interdit de fumer et de vapoter dans les terminaux. Des espaces fumeurs extérieurs sont signalés devant chaque terminal, côté public.' },
  { id: 'recharge', cat: 'services', si: /\b(recharg\w*|prises?)\b/,
    reponse: 'Des prises électriques et USB sont disponibles près des portes et dans les zones d’attente, ainsi que des bornes de recharge gratuites.' },
  { id: 'douche', cat: 'services', si: /\bdouches?\b/,
    reponse: 'Des douches sont accessibles dans les salons Feuille et Canopée (accès au salon : 35 € sans carte).' },
  { id: 'priere', cat: 'services', si: /\bpriere\b/,
    reponse: 'Un espace de recueillement multiconfessionnel est ouvert au Terminal 2, après la sûreté.' },
  { id: 'boutiques', cat: 'services', si: /./,
    reponse: 'Boutiques, duty free, restaurants, Wi-Fi gratuit, salons et consigne : les deux terminaux sont ouverts 24h/24. Demandez-moi un service précis pour avoir le détail.' },

  // ---------------- Informations ----------------
  { id: 'mineur_seul', cat: 'information', si: /\b(seuls?|non accompagnee?s?|mineurs?)\b/,
    reponse: 'Un enfant qui voyage seul (en général de 5 à 11 ans, et sur demande jusqu’à 17 ans) doit être inscrit au service d’accompagnement de la compagnie lors de la réservation. Prévoyez sa pièce d’identité, l’autorisation de sortie du territoire si nécessaire et les coordonnées de l’adulte qui l’attend à l’arrivée. Présentez-vous au comptoir au moins 2 h avant.' },
  { id: 'animaux', cat: 'information', si: /\b(chat|chien|animal|animaux|lapin|oiseau)\b/,
    reponse: 'Les petits chiens et chats (8 kg avec le sac en général) peuvent voyager en cabine dans un sac souple, les plus grands en soute dans une caisse adaptée. Il faut une puce, un passeport européen pour animal et un vaccin antirabique à jour. Réservez la place de l’animal à l’avance.' },
  { id: 'documents', cat: 'information', si: /\b(visa|documents?|papiers|passeport|carte d identite|esta|expire\w*)\b/,
    reponse: 'Dans l’espace Schengen, une carte d’identité ou un passeport valide suffit. Pour les autres pays, un passeport est nécessaire, souvent valable 6 mois après le retour, et parfois un visa ou une autorisation électronique (ESTA pour les États-Unis, par exemple). Chaque voyageur, y compris un bébé, a besoin de son propre document. Vérifiez les règles sur le site officiel du pays de destination.' },
  { id: 'heure_arrivee', cat: 'information', si: /\b(combien de temps|arriver|avance|avant le decollage|a quelle heure)\b/,
    reponse: 'Présentez-vous 2 heures avant un vol en Europe et 3 heures avant un vol international.' },
  { id: 'flotte', cat: 'information', si: /\b(boeing|777|787|dreamliner|flotte|avion|appareil)\b/,
    reponse: 'Notre flotte compte des Boeing 777-300ER (400 sièges, 3-4-3 en Économique) et des Boeing 787-9 Dreamliner (304 sièges, 3-3-3), plus silencieux et dotés de grands hublots.' },
  { id: 'terminaux', cat: 'information', si: /\b(terminal|terminaux|ouvert)\b/,
    reponse: 'L’aéroport compte 2 terminaux ouverts 24h/24 : le T1 pour les vols vers l’Europe, le T2 pour l’international.' },
  { id: 'destinations', cat: 'information', si: /\b(destinations?|desservez|pays|villes?)\b/,
    reponse: 'Nous desservons 25 aéroports internationaux : New York, Montréal, Tokyo, Dubaï, Sydney, Dakar, Lisbonne, Rome… Consultez la page « Destinations » pour les filtrer par région.' },
  { id: 'salutation', cat: 'information', si: /^(bonjour|salut|bonsoir|hello|coucou|hey|yo)\b/,
    reponse: 'Bonjour ! Je suis Zéphyr, l’assistant de l’Aéroport Émeraude. Vols, bagages, sièges, enregistrement, services : posez-moi votre question.' },
  { id: 'merci', cat: 'information', si: /\b(merci|parfait|super|genial)\b/,
    reponse: 'Avec plaisir ! N’hésitez pas si vous avez une autre question. Bon voyage avec Émeraude.' },
  { id: 'qui', cat: 'information', si: /\b(qui es tu|tu es qui|zephyr|robot|ia)\b/,
    reponse: 'Je suis Zéphyr, l’assistant de démonstration de l’Aéroport Émeraude (projet BTS SIO). Je réponds instantanément aux questions fréquentes et j’utilise une IA locale (Ollama) pour les demandes plus complexes.' }
];

// Réponses de repli par catégorie (quand aucune intention ne correspond)
export const REPONSES_CATEGORIE = {
  securite: 'Prévenez immédiatement l’agent le plus proche ou appelez le 112.',
  perturbation: 'En cas de perturbation, consultez la page « Départs » et adressez-vous aux agents du hall central, qui gèrent les réacheminements.',
  objet_perdu: 'Le service des objets trouvés est au Terminal 1, niveau 0.',
  bagage: 'Bagage cabine 55×35×25 cm (10 kg) inclus ; soute 23 kg : 0 inclus en Économique, 1 en Premium Economy, 2 en Business.',
  enregistrement: 'L’enregistrement en ligne ouvre 30 h avant le départ ; des bornes et des comptoirs sont disponibles en T1 et T2.',
  facturation: 'Pour toute question de paiement, contactez le service client avec votre référence de réservation. Rappel : les paiements de ce site sont simulés.',
  reservation: 'Les réservations se font sur la page « Réserver » et se gèrent dans « Mes réservations ».',
  assistance: 'L’assistance PMR est gratuite, à réserver 48 h avant au 01 23 45 67 89.',
  acces: 'Tram ligne E toutes les 8 minutes, taxis devant chaque terminal, parkings P1 (4 €/h) et P2 (19 €/jour).',
  services: 'Wi-Fi gratuit, salons, restaurants, boutiques et consigne sont disponibles dans les deux terminaux.',
  information: `Je n’ai pas de réponse précise à cette question. Le ${INFO_AEROPORT} et la page « Aide » pourront vous renseigner.`
};
