import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServiceInformation(): {
    name: string;
    status: string;
  } {
    return {
      name: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    };
  }
}
