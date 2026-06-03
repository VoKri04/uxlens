import { AxiosInstance } from 'axios';
import { Batch, ChatCompletion, Embeddings } from '../interfaces';
import { WithXHeaders } from 'gigachat/interfaces';
interface GetBatchFileArgs {
    fileId: string;
    accessToken?: string;
}
export declare function get_batch<T extends ChatCompletion | Embeddings>(client: AxiosInstance, args: GetBatchFileArgs): Promise<Batch<T> & WithXHeaders>;
export {};
//# sourceMappingURL=get_batch.d.ts.map