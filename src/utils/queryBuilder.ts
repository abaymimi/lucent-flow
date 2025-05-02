import { LucentQueryArgs } from '../types/baseQuery';

export class QueryBuilder {
  private query: Partial<LucentQueryArgs> = {};

  constructor(private baseUrl: string) {}

  select(fields: string[]): this {
    this.query.params = {
      ...this.query.params,
      select: fields.join(','),
    };
    return this;
  }

  where(conditions: Record<string, string | number | boolean>): this {
    this.query.params = {
      ...this.query.params,
      ...conditions,
    };
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.params = {
      ...this.query.params,
      sort: `${direction === 'desc' ? '-' : ''}${field}`,
    };
    return this;
  }

  limit(count: number): this {
    this.query.params = {
      ...this.query.params,
      _limit: count,
    };
    return this;
  }

  offset(count: number): this {
    this.query.params = {
      ...this.query.params,
      _start: count,
    };
    return this;
  }

  include(relations: string[]): this {
    this.query.params = {
      ...this.query.params,
      _embed: relations.join(','),
    };
    return this;
  }

  search(query: string): this {
    this.query.params = {
      ...this.query.params,
      q: query,
    };
    return this;
  }

  build(endpoint: string): LucentQueryArgs {
    return {
      url: `${this.baseUrl}${endpoint}`,
      method: 'GET',
      ...this.query,
    };
  }

  // Reset the builder
  reset(): this {
    this.query = {};
    return this;
  }
} 