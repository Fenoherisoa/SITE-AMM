import { ActivitySector, EventItem, NewsArticle, GalleryItem } from '../types';

export const ORGANIZATION_INFO = {
  name: 'ASSOCIATION MALAGASY MIRAY',
  acronym: 'AMM',
  slogan: 'Construire ensemble, agir durablement',
  description: 'L\'Association Malagasy Miray est une organisation dédiée au développement socio-économique, à la promotion des compétences locales et au renforcement de la solidarité au sein des communautés à Madagascar.',
  mission: 'Promouvoir l\'autonomie économique et sociale des communautés rurales et urbaines à travers le développement agricole, l\'élevage durable, la valorisation des arts et la formation professionnelle pratique.',
  vision: 'Une société malagasy solidaire, compétente et résiliente, où chaque individu valorise ses savoir-faire pour un développement durable et inclusif.',
  values: [
    { title: 'Solidarité (Fihavanana)', description: 'L\'entraide traditionnelle malagasy au cœur de toutes nos interventions communautaires.' },
    { title: 'Responsabilité', description: 'Un engagement éthique et transparent envers nos membres, nos partenaires et la société.' },
    { title: 'Excellence Pratique', description: 'La transmission de compétences concrètes et adaptées aux réalités du terrain.' },
    { title: 'Durabilité', description: 'La préserver des ressources naturelles et la pérennité des initiatives locales.' }
  ],
  approach: 'Notre approche repose sur l\'accompagnement de proximité, le transfert de compétences pratiques et l\'organisation collective pour pérenniser les opportunités économiques.',
  contactConfigured: false, // Indicates structured contact info placeholder
  addressPlaceholder: 'Siège Social - Madagascar',
  emailPlaceholder: 'contact@association-malagasy-miray.mg',
  phonePlaceholder: '+261 34 00 000 00'
};

export const ACTIVITY_SECTORS: ActivitySector[] = [
  {
    id: 'sec-1',
    slug: 'agriculture',
    title: 'Agriculture & Agroécologie',
    subtitle: 'Techniques durables, cultures vivrières et valorisation des sols',
    summary: 'Accompagnement des producteurs locaux vers une agriculture durable, résiliente face au changement climatique et sécurisante pour l\'alimentation.',
    description: 'Le volet agricole de l\'Association Malagasy Miray soutient la modernisation raisonnée des pratiques agricoles malagasy. Nous promouvons la riziculture améliorée, la diversification des cultures (cassave, maïs, maraîchage), le compostage organique et la gestion durable de l\'eau.',
    objectives: [
      'Améliorer les rendements agricoles par des techniques respectueuses de l\'environnement',
      'Former aux méthodes de fertilisation biologique et de protection intégrée des cultures',
      'Favoriser la structuration des producteurs en groupements d\'entraide',
      'Accompagner la conservation et la transformation post-récolte'
    ],
    keyProjects: [
      'Programme "Riziculture Durable & Sécurité Alimentaire"',
      'Mise en place de pépinières communautaires d\'arbres fertilisants',
      'Ateliers pratiques de production de compost organique enrichi'
    ],
    iconName: 'Sprout',
    heroImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sec-2',
    slug: 'livestock',
    title: 'Élevage & Santé Animale',
    subtitle: 'Développement de l\'élevage, apiculture et appui aux aviculteurs',
    summary: 'Renforcement des capacités en élevage (bovins, volailles, apiculture) et aménagement des ressources fourragères.',
    description: 'L\'élevage constitue un pilier économique et culturel essentiel à Madagascar. L\'Association Malagasy Miray accompagne les éleveurs dans l\'amélioration des conditions sanitaires, l\'alimentation du bétail, le développement de l\'apiculture responsable et la valorisation des filières locales.',
    objectives: [
      'Diffuser les bonnes pratiques d\'hygiène et d\'alimentation des cheptels',
      'Développer l\'apiculture moderne comme source alternative de revenus',
      'Soutenir l\'élevage avicole familial et semi-intensif',
      'Organiser des sessions de sensibilisation à la santé animale'
    ],
    keyProjects: [
      'Projet "Miel Miray" - Structuration de la filière apicole',
      'Formation des relais communautaires en suivi sanitaire avicole',
      'Aménagement de parcelles fourragères de démonstration'
    ],
    iconName: 'PawPrint',
    heroImage: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sec-3',
    slug: 'arts',
    title: 'Arts & Artisanat Culturel',
    subtitle: 'Valorisation des savoir-faire traditionnels et création artisanale',
    summary: 'Promotion de la créativité malagasy, valorisation du patrimoine artisanal (raphia, sculpture, broderie) et autonomisation.',
    description: 'Le patrimoine artistique et artisanal malagasy est d\'une richesse exceptionnelle. AMM encourage la transmission des savoir-faire traditionnels, l\'amélioration de la qualité des ouvrages (vannerie, broderie, travail du bois et du raphia) et l\'ouverture vers des débouchés commerciaux équitables.',
    objectives: [
      'Préserver et valoriser les techniques artisanales patrimoniales',
      'Perfectionner la finition et le design des articles faits main',
      'Créer des synergies entre artisans et opportunités d\'exposition',
      'Accompagner la gestion d\'activité pour les ateliers d\'artisans'
    ],
    keyProjects: [
      'Atelier de perfectionnement du travail du Raphia et fibres naturelles',
      'Exposition annuelle de l\'Artisanat et de la Création Miray',
      'Module de formation en gestion pour coopératives artisanales'
    ],
    iconName: 'Palette',
    heroImage: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sec-4',
    slug: 'training',
    title: 'Formation Professionnelle',
    subtitle: 'Développement de compétences pratiques pour adultes et autonomie',
    summary: 'Programmes de formation concrète et opérationnelle adaptés aux besoins du terrain et axés sur l\'autonomie.',
    description: 'Nos programmes de formation s\'adressent aux adultes, producteurs, éleveurs et artisans désireux de renforcer leurs capacités opérationnelles. Les cursus privilégient la pratique sur le terrain, le développement de compétences de gestion de base et l\'esprit d\'initiative.',
    objectives: [
      'Offrir des parcours certifiants et qualifiants de courte durée',
      'Transmettre des compétences techniques directement applicables',
      'Renforcer l\'esprit d\'entrepreneuriat et la gestion financière rurale',
      'Promouvoir l\'autonomie des acteurs économiques locaux'
    ],
    keyProjects: [
      'Cycle de formation Pratique "Entreprendre en Milieu Rural"',
      'Sessions d\'initiation à la gestion simplifiée de coopérative',
      'Ateliers techniques de mécanique agricole et maintenance'
    ],
    iconName: 'GraduationCap',
    heroImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sec-5',
    slug: 'community',
    title: 'Développement Communautaire',
    subtitle: 'Solidarité, entraide locale et projets d\'intérêt collectif',
    summary: 'Initiatives citoyennes, amélioration du cadre de vie et cohésion sociale au niveau des fokontany.',
    description: 'L\'esprit "Miray" (Unis) anime chaque projet communautaire. L\'association facilite la concertation locale, la mise en œuvre de travaux d\'intérêt commun (assainissement, points d\'eau, reboisement) et le renforcement des liens de solidarité intergénérationnelle.',
    objectives: [
      'Animer la concertation communautaire dans les zones d\'intervention',
      'Appuyer les travaux communautaires de reboisement et d\'assainissement',
      'Favoriser l\'entraide sociale lors d\'événements majeurs',
      'Renforcer les réseaux de solidarité locale'
    ],
    keyProjects: [
      'Campagne communautaire "Arbres & Avenir" de reboisement',
      'Comités locaux de gestion de l\'eau et de l\'environnement',
      'Espaces d\'échange citoyen et de dialogue intergénérationnel'
    ],
    iconName: 'Users',
    heroImage: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1200&q=80'
  }
];

export const EVENTS_DATA: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Atelier National sur la Transition Agroécologique',
    description: 'Rencontre d\'échange technique entre producteurs, formateurs et acteurs du développement rural sur les méthodes d\'enrichissement naturel des sols.',
    fullContent: 'Cet atelier de trois jours rassemble les délégués régionaux et les formateurs de l\'Association Malagasy Miray. Au programme : démonstrations de compostage rapide, gestion raisonnée des eaux d\'irrigation et partage d\'expériences terrain.',
    date: '2026-09-15',
    time: '08:30 - 16:30',
    location: 'Centre de Formation AMM - Antananarivo',
    category: 'Agriculture',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-2',
    title: 'Foire de l\'Artisanat et des Produits Locaux Miray',
    description: 'Exposition et mise en valeur des créations artisanales (vannerie, broderie, sculpture) et des produits agricoles issus des groupements accompagnés.',
    fullContent: 'Une opportunité pour les artisans et producteurs locaux de présenter leurs réalisations au grand public et de nouer des partenariats durables.',
    date: '2026-10-02',
    time: '09:00 - 17:00',
    location: 'Espace Culturel Communautaire',
    category: 'Arts',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-3',
    title: 'Session Pratique : Élevage Apicole et Gestion des Ruches',
    description: 'Formation technique axée sur le suivi des reines, la récolte propre du miel et l\'entretien du matériel apicole.',
    fullContent: 'Destinée aux apiculteurs membres du réseau AMM, cette session combine cours pratiques en rucher-école et théorie de la santé des colonies.',
    date: '2026-11-12',
    time: '08:00 - 15:00',
    location: 'Site Expérimental Apicole',
    category: 'Livestock',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'evt-4',
    title: 'Journée de Reboisement Communautaire "Fihavanana"',
    description: 'Action collective de plantation d\'arbres fruitiers et d\'espèces autochtones pour la protection des bassins versants.',
    fullContent: 'Plus de 2 000 jeunes plants ont été mis en terre lors de cette journée citoyenne rassemblant membres de l\'association, jeunes et notables locaux.',
    date: '2026-02-20',
    time: '07:30 - 13:00',
    location: 'Zone de Protection Environnementale',
    category: 'Community',
    status: 'past',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'
  }
];

export const NEWS_DATA: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Lancement du Programme de Structuration des Groupements Agricoles',
    excerpt: 'L\'Association Malagasy Miray renforce son réseau d\'accompagnement sur le terrain pour soutenir 15 nouveaux groupements villageois.',
    content: 'Dans le cadre de son plan d\'action annuel, l\'Association Malagasy Miray (AMM) annonce le déploiement d\'un programme structurant dédié à la consolidation des groupements de producteurs. Ce programme vise à transmettre des outils simples de gestion comptable, d\'organisation des travaux collectifs et d\'accès facilité aux intrants agricoles de qualité.\n\nLes équipes de terrain interviendront auprès des communautés pour dispenser des modules pratiques adaptés aux réalités locales, renforçant ainsi la cohésion et l\'autonomie des agriculteurs.',
    date: '12 Juillet 2026',
    category: 'Agriculture',
    author: 'Direction de la Communication AMM',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
    readTime: '3 min'
  },
  {
    id: 'news-2',
    title: 'Bilan Positif du Cycle de Formation en Apiculture Durable',
    excerpt: 'Plus de 45 éleveurs ont complété avec succès le cursus pratique dédié à la conduite des ruches modernes.',
    content: 'Le volet élevage de l\'AMM vient de clôturer une série d\'ateliers consacrés au développement de la filière miel. Durant quatre semaines, les participants ont appris à fabriquer des ruches à partir de matériaux locaux, à gérer les périodes de floraison et à effectuer l\'extraction du miel selon des normes d\'hygiène rigoureuses.\n\nCe programme contribue directement à la diversification des revenus des foyers ruraux tout en favorisant la pollinisation des cultures avoisinantes.',
    date: '28 Juin 2026',
    category: 'Livestock',
    author: 'Pôle Formation & Élevage',
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80',
    readTime: '4 min'
  },
  {
    id: 'news-3',
    title: 'Valorisation des Arts Malagasy : Succès des Ateliers de Vannerie',
    excerpt: 'Les créatrices locales présentent une collection originale d\'objets tressés combinant tradition et esthétique contemporaine.',
    content: 'Le pôle Artisanat de l\'Association Malagasy Miray continue d\'accompagner les artisanes spécialisées dans le travail du raphia et des fibres de cyperus. La récente session de perfectionnement s\'est concentrée sur le contrôle qualité, le traitement écologique des teintures végétales et l\'emballage durable.\n\nLes créations seront exposées lors des prochains événements institutionnels de l\'association.',
    date: '15 Mai 2026',
    category: 'Arts',
    author: 'Commission Culture & Artisanat',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    readTime: '3 min'
  }
];

export const GALLERY_DATA: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Formation sur le terrain - Préparation du compost biologique',
    category: 'Agriculture',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    caption: 'Membres de l\'AMM participant à un atelier pratique de fertilisation naturelle.',
    date: 'Juin 2026'
  },
  {
    id: 'gal-2',
    title: 'Suivi sanitaire des cheptels avicoles',
    category: 'Livestock',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    caption: 'Séance de démonstration sanitaire pour les éleveurs de volailles.',
    date: 'Mai 2026'
  },
  {
    id: 'gal-3',
    title: 'Création en raphia et tressage traditionnel',
    category: 'Arts',
    imageUrl: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80',
    caption: 'Valorisation du travail artisanal des femmes membres du réseau AMM.',
    date: 'Avril 2026'
  },
  {
    id: 'gal-4',
    title: 'Atelier de formation professionnelle en gestion',
    category: 'Training',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    caption: 'Session d\'apprentissage des principes d\'organisation de coopératives.',
    date: 'Mars 2026'
  },
  {
    id: 'gal-5',
    title: 'Action de reboisement citoyen',
    category: 'Community',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    caption: 'Mobilisation communautaire pour la protection des sols et des arbres.',
    date: 'Février 2026'
  },
  {
    id: 'gal-6',
    title: 'Récolte et apiculture durable',
    category: 'Livestock',
    imageUrl: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    caption: 'Suivi des ruchers sous la supervision d\'un formateur qualifié.',
    date: 'Janvier 2026'
  }
];
