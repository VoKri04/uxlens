import { AxiosInstance } from 'axios';
import { BatchStatus, WithXHeaders } from '../interfaces';
interface GetBatchArgs {
    batchId: string;
    accessToken?: string;
}
export declare function get_batch_status(client: AxiosInstance, args: GetBatchArgs): Promise<BatchStatus & WithXHeaders>;
export {};
//# sourceMappingURL=get_batch_status.d.ts.map