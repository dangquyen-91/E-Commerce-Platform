import { Model, Document, UpdateQuery } from "mongoose";

// For mongoose 9.x, use Record<string, any> or Partial<T> for filters
type QueryFilter<T> = Partial<T> | Record<string, any>;

export class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async findOne(filter?: QueryFilter<T>): Promise<T | null> {
    return this.model.findOne(filter as any);
  }

  async findMany(
    filter: QueryFilter<T> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | string[];
    } = {}
  ): Promise<T[]> {
    let query = this.model.find(filter as any);

    if (options.skip) {
      query = query.skip(options.skip);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.sort) {
      query = query.sort(options.sort);
    }
    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter as any);
  }

  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async updateOne(
    filter: QueryFilter<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter as any, data, { new: true });
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id);
  }

  async softDelete(id: string): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }
}
