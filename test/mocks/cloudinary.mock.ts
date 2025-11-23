/**
 * Shared Cloudinary mock for unit and e2e tests
 *
 * Usage in test files:
 * jest.mock('cloudinary', () => require('test/mocks/cloudinary.mock').mockCloudinary());
 */

export const mockCloudinary = () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'mocked-upload',
      }),
      explicit: jest.fn().mockResolvedValue({
        display_name: 'display-name',
      }),
      rename: jest.fn().mockResolvedValue({
        public_id: 'renamed-id',
      }),
      destroy: jest.fn().mockResolvedValue({}),
    },
    api: {
      resources: jest.fn().mockResolvedValue({
        resources: [],
      }),
      delete_folder: jest.fn().mockResolvedValue({}),
    },
    url: jest.fn().mockReturnValue('https://mocked-url'),
    config: jest.fn(),
  },
});

/**
 * Get typed references to mocked Cloudinary functions
 * Useful for setting up test-specific behavior or assertions
 */
export const getCloudinaryMocks = () => {
  const cloudinary = require('cloudinary').v2;

  return {
    upload: cloudinary.uploader.upload as jest.Mock,
    explicit: cloudinary.uploader.explicit as jest.Mock,
    rename: cloudinary.uploader.rename as jest.Mock,
    destroy: cloudinary.uploader.destroy as jest.Mock,
    resources: cloudinary.api.resources as jest.Mock,
    deleteFolder: cloudinary.api.delete_folder as jest.Mock,
    url: cloudinary.url as jest.Mock,
    config: cloudinary.config as jest.Mock,
  };
};
