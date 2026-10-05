import { RequestHeartbeat } from "./requests/RequestHeartbeat";
import { RequestProfileAll } from "./requests/RequestProfileAll";
import { RequestProfileUpload } from "./requests/RequestProfileUpload";
import { RequestSecure } from "./requests/RequestSecure";
import { ResponseCode } from "./response/ResponseCodes";
import { ResponseHeartbeat } from "./response/ResponseHeartbeat";
import { ResponseNonce } from "./response/ResponseNonce";
import { ResponseProfileAll } from "./response/ResponseProfileAll";
import { ResponseProfileUpload } from "./response/ResponseProfileUpload";
import type { ThermalProfile } from "./ThermalProfile";
import { SmartBuffer } from "./utils/SmartBuffer";

const api_key = import.meta.env.VITE_API_KEY;

const temp_config = {
  psk: api_key,
}

temp_config.psk = temp_config.psk.slice()

const Api = {
  nonce: "/api/nonce",
  heartbeat: "/api/heartbeat",
  profiles: "/api/profiles",
  profile: "/api/profile",
};

export class WebApi {

  constructor() {
  }

  private async GetNonce(): Promise<Uint8Array> {
    const response = await fetch(Api.nonce, {
      method: "POST",
    });
    
    const responseBuffer = new SmartBuffer(await response.arrayBuffer());

    const NonceResponse = ResponseNonce.deserialize(responseBuffer);

    if (NonceResponse.Response != ResponseCode.nonce) {
      throw new Error("Unexpected reponse!");
    }

    console.log(NonceResponse)
    return NonceResponse.nonce;
  }

  public async GetHeartbeat(): Promise<any> {
    const nonce = await this.GetNonce();
    const request = new RequestHeartbeat();
    request.nonce = nonce;
        
    const requestBuffer = await request.Serialize();
    await RequestSecure.Sign(requestBuffer);
    const response = await fetch(Api.heartbeat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: requestBuffer
    });
    const responseBuffer = new SmartBuffer(await response.arrayBuffer());
    const heartbeatResponse = ResponseHeartbeat.deserialize(responseBuffer);
    console.log(heartbeatResponse);
  }

  public async GetProfiles() {
    const nonce = await this.GetNonce();

    const request = new RequestProfileAll();
    request.nonce = nonce;

    const requestBuffer = await request.Serialize();
    await RequestSecure.Sign(requestBuffer);
    const response = await fetch(Api.profiles, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: requestBuffer,

    });

    if(response.status != 200){
      throw new Error(await response.text());
    }
    const responseBuffer = new SmartBuffer(await response.arrayBuffer());
    const responseProfileAll = ResponseProfileAll.deserialize(responseBuffer);
    console.log(responseProfileAll);
    return responseProfileAll;

  }

  public async PutProfile(profile:ThermalProfile) {
    const request = new RequestProfileUpload(profile);
    request.nonce = await this.GetNonce();

    const requestBuffer = await request.Serialize();

    await RequestSecure.Sign(requestBuffer);
    const response = await fetch(Api.profile, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: requestBuffer
    });

    const responseBuffer = new SmartBuffer(await response.arrayBuffer());
    const responseProfileAll = ResponseProfileUpload.deserialize(responseBuffer);
    console.log(responseProfileAll);
    return responseProfileAll;
  }


}

