import { type IUser, EUserType } from '@/modules/auth'

export interface ISupport {
  id: number
  code: string
  requestedAt: string
  category: string
  status: string
  messages: Message[]
}

interface Message {
  id: number
  supportId: number
  sender: IUser
  content: string
  sentAt: string
  type: 'text' | 'image' | 'file'
  status: 'sent' | 'delivered' | 'read'
}

export const supports: ISupport[] = [
  {
    id: 1,
    code: '001',
    requestedAt: '17/05/2026',
    category: 'Financeiro',
    status: 'Concluído',
    messages: [
      {
        id: 1,
        supportId: 1,
        sender: {
          name: 'João Silva',
          email: 'joao.silva@example.com',
          profile_picture: null,
          type: EUserType.STANDARD,
        },
        content: 'Olá, tenho uma dúvida sobre minha fatura.',
        sentAt: '17/05/2026 10:00',
        type: 'text',
        status: 'read',
      },
      {
        id: 2,
        supportId: 1,
        sender: {
          name: 'Admin',
          email: 'admin@example.com',
          profile_picture: null,
          type: EUserType.ADMIN,
        },
        content: 'Olá! Claro, em que posso ajudar?',
        sentAt: '17/05/2026 10:05',
        type: 'text',
        status: 'read',
      },
    ],
  },
  {
    id: 2,
    code: '002',
    requestedAt: '15/05/2026',
    category: 'Sistema',
    status: 'Pendente',
    messages: [
      {
        id: 1,
        supportId: 2,
        sender: {
          name: 'João Silva',
          email: 'joao.silva@example.com',
          profile_picture: null,
          type: EUserType.STANDARD,
        },
        content: 'Estou enfrentando um erro ao acessar minha conta.',
        sentAt: '15/05/2026 14:30',
        type: 'text',
        status: 'sent',
      },
    ],
  },
]
