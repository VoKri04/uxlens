import { AxiosInstance } from 'axios';
import { WithXHeaders, BatchRequest, BATCH_METHOD, BatchStatus } from '../interfaces';
interface GetChatArgs {
    batch: BatchRequest[];
    method: BATCH_METHOD;
    accessToken?: string;
}
export declare function post_batch(client: AxiosInstance, args: GetChatArgs): Promise<BatchStatus & WithXHeaders>;
export {};
//# sourceMappingURL=post_batch.d.ts.map