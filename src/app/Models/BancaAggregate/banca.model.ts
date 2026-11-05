export enum BancaType {
  TradutorInterprete = 1,
  Instrutor = 2,
  Outra = 3
}

export enum BancaStatus {
  Rascunho = 0,
  Ativa = 1,
  Cancelada = 2
}

/** Fase calculada pela API a partir do estado e das datas. */
export enum BancaPhase {
  Rascunho = 0,
  Cancelada = 1,
  InscricoesEmBreve = 2,
  /** Inclui a conferência de documentos, que acontece durante as inscrições. */
  InscricoesAbertas = 3,
  AguardandoBanca = 5,
  BancaEmAndamento = 6,
  AguardandoResultado = 7
}

export interface BancaSummary {
  id: string;
  entityId: string;
  title: string;
  type: BancaType;
  typeName: string;
  editalNumber?: string | null;
  inscriptionStart?: string | null;
  inscriptionEnd?: string | null;
  examStart?: string | null;
  examEnd?: string | null;
  locationName?: string | null;
  status: BancaStatus;
  phase: BancaPhase;
  /** Rascunho com o cadastro completo (pode ser ativado). */
  canActivate: boolean;
  /** Etapas do cadastro completas: 1 Informações, 2 Data e local. */
  infoDone: boolean;
  scheduleDone: boolean;
  createdByEmail?: string | null;
  canceledByEmail?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
}

/** Campos editáveis (as 5 etapas do editor). Datas "AAAA-MM-DD". */
export interface SaveBanca {
  id?: string | null;
  entityId: string;
  type: BancaType;
  customTypeName?: string | null;
  title: string;
  editalNumber?: string | null;
  summary?: string | null;
  forWhom?: string | null;
  howEvaluated?: string | null;
  whatToBring?: string | null;
  criteria: string[];
  /** Período das inscrições; a conferência de documentos acontece dentro dele. */
  inscriptionStart?: string | null;
  inscriptionEnd?: string | null;
  /** Período da banca (um ou mais dias). O horário de cada candidato é definido pelos avaliadores. */
  examStart?: string | null;
  examEnd?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationNumber?: string | null;
  locationRoom?: string | null;
  /** Acessibilidade, estacionamento, como chegar... */
  locationNotes?: string | null;
  gradersCount: number;
  videoUrl?: string | null;
  videoHasSubtitles: boolean;
  /** Descrição da arte para leitores de tela. */
  imageAlt?: string | null;
  /** Com arte e vídeo: true mostra o vídeo nas notícias. */
  newsShowsVideo: boolean;
  highlight: boolean;
  notifyRegion: boolean;
  notifyExpiringCertificates: boolean;
}

export interface Banca extends SaveBanca {
  id: string;
  entityName?: string | null;
  typeName: string;
  status: BancaStatus;
  phase: BancaPhase;
  hasEdital: boolean;
  editalFileName?: string | null;
  hasImage: boolean;
  imageVersion?: string | null;
  createdAt: string;
  createdByEmail?: string | null;
  activatedAt?: string | null;
  activatedByEmail?: string | null;
  canceledAt?: string | null;
  canceledByEmail?: string | null;
  cancelReason?: string | null;
  canManage: boolean;
  missingForActivation: string[];
}

export interface News {
  id: string;
  entityId: string;
  bancaId?: string | null;
  category: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  videoUrl?: string | null;
  /** Versão da arte da banca ligada à notícia (nula = sem arte). */
  bancaImageVersion?: string | null;
  bancaImageAlt?: string | null;
  highlight: boolean;
  publishedAt?: string | null;
}
