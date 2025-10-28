import { ApiProperty } from '@nestjs/swagger';

export class ImportJsonDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
