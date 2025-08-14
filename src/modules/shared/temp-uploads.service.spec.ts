import { TempUploadsService } from './temp-uploads.service';

describe('TempUploadsService', () => {
  let service: TempUploadsService;

  beforeEach(() => {
    service = new TempUploadsService();
  });

  describe('store', () => {
    it('should store a secureUrl and publicId mapping', () => {
      service.store('https://example.com/image.png', 'public-id');
      expect(service.get('https://example.com/image.png')).toBe('public-id');
    });

    it('should overwrite existing mapping if secureUrl already stored', () => {
      service.store('https://example.com/image.png', 'id1');
      service.store('https://example.com/image.png', 'id2');
      expect(service.get('https://example.com/image.png')).toBe('id2');
    });
  });

  describe('get', () => {
    it('should return undefined if secureUrl not stored', () => {
      expect(service.get('https://nonexistent.com')).toBeUndefined();
    });

    it('should return the publicId if secureUrl exists', () => {
      service.store('https://example.com/img.png', 'pid123');
      expect(service.get('https://example.com/img.png')).toBe('pid123');
    });
  });

  describe('remove', () => {
    it('should remove the mapping and return true', () => {
      service.store('https://example.com/img.png', 'pid123');
      const result = service.remove('https://example.com/img.png');
      expect(result).toBe(true);
      expect(service.get('https://example.com/img.png')).toBeUndefined();
    });

    it('should return false if secureUrl does not exist', () => {
      expect(service.remove('https://nonexistent.com')).toBe(false);
    });
  });
});
