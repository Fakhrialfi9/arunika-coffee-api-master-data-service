import { describe, expect, it, vi } from 'vitest';

import { MasterDataGrpcController } from '../../src/presentation/grpc/master-data.grpc.controller.js';

describe('Step 26 gRPC foundation', () => {
  it('exposes the MasterDataService health handler', () => {
    const crud = {} as never;
    const relationships = {} as never;
    const controller = new MasterDataGrpcController(crud, relationships);

    expect(controller.getHealth()).toEqual({
      service: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    });
  });

  it('rejects unsupported gRPC entities before reaching the application layer', async () => {
    const crud = {
      create: vi.fn(),
    } as never;
    const relationships = {} as never;
    const controller = new MasterDataGrpcController(crud, relationships);

    await expect(
      controller.createMasterData({ entity: 'unknown', data_json: '{}' }),
    ).rejects.toThrow('Unsupported master-data entity: unknown');
  });
});
