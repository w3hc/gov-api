import { ApiProperty } from '@nestjs/swagger';

export class CreateDaoDto {
  @ApiProperty({
    description: 'The Ethereum address of the DAO',
    example: '0xcf57e1760D0F969F558811007A74f4268281C4Ea',
  })
  address: string;
}
