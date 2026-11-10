import { buildContainer } from './composition-root';
import { CleanupOrphanPhotosUseCase } from './modules/photo/application/cleanup-orphan-photos.use-case';

describe('buildContainer', () => {
  it('resolves registered controllers and use cases as singletons', () => {
    const container = buildContainer();

    expect(container.resolve('photoController')).toBe(container.resolve('photoController'));
    expect(container.resolve('productController')).toBe(container.resolve('productController'));
    expect(container.resolve('cleanupOrphanPhotosUseCase')).toBe(
      container.resolve('cleanupOrphanPhotosUseCase'),
    );
    expect(container.resolve('cleanupOrphanPhotosUseCase')).toBeInstanceOf(CleanupOrphanPhotosUseCase);
  });
});
