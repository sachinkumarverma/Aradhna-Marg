"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorService = exports.AuthorService = void 0;
const AuthorRepository_1 = require("../repositories/AuthorRepository");
const appError_1 = require("../errors/appError");
class AuthorService {
    async getAuthors(options) {
        return AuthorRepository_1.authorRepository.findAll(options);
    }
    async getAuthor(id) {
        const author = await AuthorRepository_1.authorRepository.findById(id);
        if (!author)
            throw new appError_1.NotFoundError('Author not found');
        return author;
    }
    async createAuthor(data) {
        return AuthorRepository_1.authorRepository.create(data);
    }
    async updateAuthor(id, data) {
        await this.getAuthor(id); // Ensure exists
        return AuthorRepository_1.authorRepository.update(id, data);
    }
    async deleteAuthor(id) {
        await this.getAuthor(id); // Ensure exists
        return AuthorRepository_1.authorRepository.delete(id);
    }
    async bulkDeleteAuthors(ids) {
        for (const id of ids) {
            await AuthorRepository_1.authorRepository.delete(id);
        }
    }
    async bulkEditAuthors(ids, data) {
        for (const id of ids) {
            await AuthorRepository_1.authorRepository.update(id, data);
        }
    }
}
exports.AuthorService = AuthorService;
exports.authorService = new AuthorService();
