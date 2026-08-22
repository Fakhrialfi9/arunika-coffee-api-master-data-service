import { describe, expect, it } from 'vitest';

import { MasterDataGrpcController } from '../../src/presentation/grpc/master-data.grpc.controller.js';

describe('Step 26 gRPC foundation', () => {
  it('exposes the MasterDataService health handler', () => {
    const controller = new MasterDataGrpcController();

    expect(controller.getHealth()).toEqual({
      service: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    });
  });
});
