import { Test, type TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  const serviceInformation = {
    name: 'arunika-coffee-api-master-data-service',
    status: 'ok',
  };

  const appServiceMock: Pick<AppService, 'getServiceInformation'> = {
    getServiceInformation: () => serviceInformation,
  };

  it('should return service information', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    const controller = module.get<AppController>(AppController);

    expect(controller.getServiceInformation()).toEqual(serviceInformation);
    await module.close();
  });
});
