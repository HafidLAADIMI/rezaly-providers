// services/categoryService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, SubCategory } from '../types';

class CategoryService {
  private readonly collectionName = 'categories';

  // Get all active categories
  async getAllCategories(): Promise<Category[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const categoryRef = doc(db, this.collectionName, categoryId);
      const categorySnap = await getDoc(categoryRef);
      
      if (categorySnap.exists()) {
        return { id: categorySnap.id, ...categorySnap.data() } as Category;
      }
      return null;
    } catch (error) {
      console.error('Error getting category:', error);
      return null;
    }
  }

  // Get subcategories by category ID
  async getSubCategories(categoryId: string): Promise<SubCategory[]> {
    try {
      const q = query(
        collection(db, 'subCategories'),
        where('categoryId', '==', categoryId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const subCategories: SubCategory[] = [];
      querySnapshot.forEach((doc) => {
        subCategories.push({ id: doc.id, ...doc.data() } as SubCategory);
      });

      return subCategories;
    } catch (error) {
      console.error('Error getting subcategories:', error);
      return [];
    }
  }

  // Search categories by name
  async searchCategories(searchText: string): Promise<Category[]> {
    try {
      const allCategories = await this.getAllCategories();
      
      if (!searchText.trim()) {
        return allCategories;
      }

      return allCategories.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase()) ||
        category.description.toLowerCase().includes(searchText.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }
}

export const categoryService = new CategoryService();