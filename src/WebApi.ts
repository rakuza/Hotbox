import { RequestHeartbeat } from "./requests/RequestHeartbeat";
import { RequestProfileAll } from "./requests/RequestProfileAll";
import { ResponseCode } from "./response/ResponseCodes";
import { ResponseHeartbeat } from "./response/ResponseHeartbeat";
import { ResponseNonce } from "./response/ResponseNonce";
import { ResponseProfileAll } from "./response/ResponseProfileAll";

const api_key = import.meta.env.VITE_API_KEY;

const temp_config = {
    psk: api_key,
}

temp_config.psk = temp_config.psk.slice()

const Api = {
  nonce:"/api/nonce",
  heartbeat:"/api/heartbeat",
  profiles:"/api/profiles",
};

export class WebApi {

    constructor() {
    }

    private async GetNonce():Promise<Uint8Array>{
        const response = await fetch(Api.nonce, {
            method: "POST",
        });
        const responseBuffer = await response.arrayBuffer();

        const NonceResponse = ResponseNonce.deserialize(responseBuffer);

        if(NonceResponse.header.Response != ResponseCode.nonce){
            throw new Error("Unexpected reponse!");
        }

        console.log(NonceResponse)
        return NonceResponse.nonce;
    }

    public async GetHeartbeat(): Promise<any>{
        
        const nonce = await this.GetNonce();

        const request = new RequestHeartbeat();
        request.nonce = nonce;
        const requestBuffer = request.Serialize();
        const response = await fetch(Api.heartbeat,{
            method: 'POST',
            headers:{'Content-Type': 'application/octet-stream'},
            body: requestBuffer
        });

        const heartbeatResponse = ResponseHeartbeat.deserialize(await response.arrayBuffer());
        console.log(heartbeatResponse);
    }

    public async GetProfiles(){
        const nonce = await this.GetNonce();

        const request = new RequestProfileAll();
        request.nonce = nonce;
        const requestBuffer = request.Serialize();
        const response = await fetch(Api.profiles,{
            method: 'POST',
            headers:{'Content-Type': 'application/octet-stream'},
            body: requestBuffer
        });

        const responseProfileAll = ResponseProfileAll.deserialize(await response.arrayBuffer());
        console.log(responseProfileAll);
        return responseProfileAll;
  
    }


}

