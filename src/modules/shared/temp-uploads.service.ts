import { Injectable } from '@nestjs/common';

@Injectable()
export class TempUploadsService {
  private uploads = new Map<string, string>();

  store(secureUrl: string, publicId: string): void {
    this.uploads.set(secureUrl, publicId);
  }

  get(secureUrl: string): string | undefined {
    return this.uploads.get(secureUrl);
  }

  remove(secureUrl: string): boolean {
    return this.uploads.delete(secureUrl);
  }
}
