export interface Book {
  id?: string;           // MongoDB _id
  title: string;
  author: string;
  year?: number;         // Año opcional
  genre: string;
  isAvailable: boolean;
}
