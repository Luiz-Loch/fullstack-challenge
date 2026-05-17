import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items for the current page', type: Array<T> })
  public readonly data: Array<T>;

  @ApiProperty({ description: 'Total number of items matching the query' })
  public readonly total: number;

  @ApiProperty({ description: 'Current page number' })
  public readonly page: number;

  @ApiProperty({ description: 'Number of items per page' })
  public readonly limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  public readonly totalPages: number;

  public constructor(data: Array<T>, total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}