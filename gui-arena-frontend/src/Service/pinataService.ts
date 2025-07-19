const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class PinataService {
  private static readonly BASE_URL = 'https://api.pinata.cloud';

  static async uploadFile(file: File): Promise<PinataResponse> {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT token is not configured. Please add REACT_APP_PINATA_JWT to your .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: `meme-${Date.now()}-${file.name}`,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        type: 'meme',
        app: 'gui-arena'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${this.BASE_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  static async uploadJSON(jsonObject: any): Promise<PinataResponse> {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT token is not configured.');
    }

    const response = await fetch(`${this.BASE_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: jsonObject,
        pinataMetadata: {
          name: `meme-metadata-${Date.now()}`,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'metadata',
            app: 'gui-arena'
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata JSON upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  static getIPFSUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  static async testConnection(): Promise<boolean> {
    if (!PINATA_JWT) {
      console.error('Pinata JWT token is not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return false;
    }
  }
}