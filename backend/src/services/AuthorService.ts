import { authorRepository } from '@repositories/AuthorRepository';
import { CreateAuthorDTO, UpdateAuthorDTO } from '@models/Author';
import { NotFoundError } from '@/errors/appError';

export class AuthorService {
  async getAuthors(options: { search?: string, sort?: string, order?: 'asc' | 'desc', page?: number, limit?: number, status?: string }) {
    return authorRepository.findAll(options);
  }

  async getAuthor(id: string) {
    const author = await authorRepository.findById(id);
    if (!author) throw new NotFoundError('Author not found');
    return author;
  }

  async createAuthor(data: CreateAuthorDTO) {
    return authorRepository.create(data);
  }

  async updateAuthor(id: string, data: UpdateAuthorDTO) {
    await this.getAuthor(id); // Ensure exists
    return authorRepository.update(id, data);
  }

  async deleteAuthor(id: string) {
    await this.getAuthor(id); // Ensure exists
    return authorRepository.delete(id);
  }

  async bulkDeleteAuthors(ids: string[]) {
    for (const id of ids) {
      await authorRepository.delete(id);
    }
  }

  async bulkEditAuthors(ids: string[], data: UpdateAuthorDTO) {
    for (const id of ids) {
      await authorRepository.update(id, data);
    }
  }
}

export const authorService = new AuthorService();
