export type Category =
  | '食費'
  | '日用品'
  | '交通費'
  | '外食'
  | '娯楽'
  | 'その他';

export const CATEGORIES: Category[] = [
  '食費',
  '日用品',
  '交通費',
  '外食',
  '娯楽',
  'その他',
];

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  store: string;
  category: Category | null;
  memo: string | null;
  created_at: string;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'user_id' | 'created_at'>;

