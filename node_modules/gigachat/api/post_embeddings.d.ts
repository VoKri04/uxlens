import { AxiosInstance } from 'axios';
import { Embeddings, WithXHeaders, EmbeddingRequest } from '../interfaces';
interface GetEmbeddingsArgs extends EmbeddingRequest {
    accessToken?: string;
}
export declare function post_embeddings(client: AxiosInstance, args: GetEmbeddingsArgs): Promise<Embeddings & WithXHeaders>;
export {};
//# sourceMappingURL=post_embeddings.d.ts.map