import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getServiceInformation(): {
    name: string;
    status: string;
  } {
    return this.appService.getServiceInformation();
  }
}
