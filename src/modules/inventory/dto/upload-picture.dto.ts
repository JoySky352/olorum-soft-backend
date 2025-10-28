import { ApiProperty } from '@nestjs/swagger';

export class UploadPictureDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
