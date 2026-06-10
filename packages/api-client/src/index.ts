export interface ApiClientOptions {
  baseUrl: string;
}

export class PinTripApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async health() {
    const response = await fetch(`${this.options.baseUrl}/api/health`);
    return response.json();
  }
}
