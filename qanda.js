const request = require("request");
const fs = require("fs");
const cheerio = require("cheerio");

url2stream = function(url) {
    return new Promise((resolve, reject) => {
        var key = String(Math.random()).replace(".", "");
        (request(url).pipe(fs.createWriteStream(`${key}.jpg`)).on("finish", () => {
            resolve(fs.readFileSync(`${key}.jpg`))
            fs.unlinkSync(`${key}.jpg`)
        }))
    });
};

String.prototype.removeSymbol = function(detail) {
    return detail == true ? this.replace(/\$|text|\\|{|}/g, "") : this.replace(/\$|text|\\/g, "");
}

module.exports.search = async function(input) {

    var readStream;
    if (String(input).startsWith("http")) {
        try {
            readStream = await url2stream(input)
        } catch (e) {
            throw new Error("알 수 없는 이미지입니다.");
        }
    } else {
        try {
            readStream = fs.createReadStream(input).on("error",function(){
                throw new Error("해당 경로를 찾을 수 없습니다.");
            });
        } catch (e) {
            throw new Error("해당 경로를 찾을 수 없습니다.");
        }
    }

    return new Promise((resolve, reject) => {

        request.get({
            url: "https://api-gateway.qanda.ai/api/v2/aws/fileserver/key/?ext=jpg",
            headers: {
                "Authorization": "Token 78e41643473b64388bfaa664485ec0a50069d994",
                "Accept-Language": "ko",
                "X-Service-Locale": "ko_KR",
                "X-Jarvis-Config": "prod",
                "Content-Type": "charset=utf-8",
                "X-AP-MAC": "7085C2809FCE",
                "X-Android-DeviceID": "a805ea1bcafe6595",
                "X-IP-ADDRESS": "172.16.61.2",
                "X-Android-DeviceOS": "5.1.1",
                "X-Android-DeviceName": "SM-G965N",
                "X-Android-Version": "4307",
                "X-App-ID": "com.mathpresso.qanda",
                "User-Agent": "QandaStudent/4307 (com.mathpresso.qanda; OS:22)",
                "Connection": "Keep-Alive",
            }
        }, function(e, r, b) {

            if (e) throw new Error("서버에 연결할 수 없습니다.");

            var imgSet;
            try {
                imgSet = JSON.parse(b);
                if (imgSet.credentials.fields.success_action_status != 201) new Error("서버에 이미지 불러오기 실패");
            } catch (e) {
                throw new Error("서버에 이미지 불러오기 실패");
            }
            var formdata = {
                key: "key",
                key: imgSet.image_key + ".jpg",

                bucket: "bucket",
                bucket: imgSet.credentials.fields.bucket,

                "content-type": "content-type",
                "content-type": "image/jpeg",

                policy: "policy",
                policy: imgSet.credentials.fields.policy,

                "x-amz-algorithm": "x-amz-algorithm",
                "x-amz-algorithm": imgSet.credentials.fields["x-amz-algorithm"],

                acl: "acl",
                acl: imgSet.credentials.fields.acl,

                "success_action_status": "success_action_status",
                "success_action_status": imgSet.credentials.fields.success_action_status,

                "x-amz-date": "x-amz-date",
                "x-amz-date": imgSet.credentials.fields["x-amz-date"],

                "x-amz-signature": "x-amz-signature",
                "x-amz-signature": imgSet.credentials.fields["x-amz-signature"],

                "x-amz-credential": "x-amz-credential",
                "x-amz-credential": imgSet.credentials.fields["x-amz-credential"],

                file: "file",
                file: readStream
            }

            request.post({
                url: "https://qanda-storage.qanda.ai/",
                formData: formdata,
                headers: {
                    "Accept-Encoding": "gzip",
                    "User-Agent": "okhttp/4.8.1"
                }
            }, function(e, r, b2) {

                if (e) throw new Error("서버에 이미지를 저장할 수 없습니다.");

                request.get({
                    url: `https://srw.qanda.ai/?image_key=${imgSet.image_key}&source=search&grade=8&features=qalculator%2Cqna_testing%2Cshare%2Csocratiq%2Clabel%2Cvideo-explanation%2Cbq-source-button%2Cbq-solution%2Cnew-search-interface`,
                    headers: {
                        "Connection": "keep-alive",
                        "Pragma": "no-cache",
                        "Cache-Control": "no-cache",
                        "Upgrade-Insecure-Requests": "1",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 5.1.1; SM-G965N Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
                        "x-jarvis-config": "prod",
                        "x-app-id": "com.mathpresso.qanda",
                        "x-android-devicename": "SM-G965N",
                        "x-android-version": "4307",
                        "x-android-deviceid": "a805ea1bcafe6595",
                        "content-type": "charset=utf-8",
                        "ocr_start_at": "1611538536386",
                        "x-android-deviceos": "5.1.1",
                        "x-service-locale": "ko_KR",
                        "x-ip-address": "172.16.61.2",
                        "x-ap-mac": "7085C2809FCE",
                        "accept-language": "ko",
                        "authorization": "Token 78e41643473b64388bfaa664485ec0a50069d994",
                        "Cookie": ": _gid=GA1.2.651919531.1611535953; _gat_gtag_UA_163755145_1=1; _ga=GA1.1.799172920.1611535953; _ga_5TKY975NNL=GS1.1.1611550117.2.1.1611551487.59",
                        "X-Requested-With": "com.mathpresso.qanda"
                    }

                }, function(e, r, b3) {

                    if (e) throw new Error("검색 결과를 가져올 수 없습니다.");

                    const $ = cheerio.load(b3);
                    var result = [];
                    var data, info;
                    try {
                        data = JSON.parse($("#__NEXT_DATA__").html());
                        info = data.props.pageProps.searchResultResponse.ocr_results
                    } catch (e) {
                        throw new Error("검색 결과를 가져올 수 없습니다.");
                    }

                    info.forEach(o => {
                        if (o.page_type != "ocr_search") return;
                        var add = {};
                        add.question = o.ocr_search.question_image_urls[0];
                        if (o.ocr_search.answer_type == "answer_image") {
                            add.answer = o.ocr_search.answer_image.image_urls
                        } else {
                            var msgs = o.ocr_search.answer_chat.messages;
                            var imgs = [];
                            msgs.forEach(o2 => {
                                if (o2.sender_type != "teacher") return;
                                if (o2.message_type == "image") imgs.push(o2.image)
                            })
                            add.answer = imgs;
                        }
                        result.push(add);
                    });
                    resolve(result);
                });
            });
        });
    });
}

module.exports.calculation = async function(exp) {

    return new Promise((resolve, reject) => {

        request.post({
            url: "https://api-gateway.qanda.ai/api/v3/question/input_formula/?version=2&editor_version=2",
            headers: {
                "Authorization": "Token 78e41643473b64388bfaa664485ec0a50069d994",
                "Accept-Language": "ko",
                "X-Service-Locale": "ko_KR",
                "X-Jarvis-Config": "prod",
                "Content-Type": "application/x-www-form-urlencoded",
                "X-AP-MAC": "7085C2809FCE",
                "X-Android-DeviceID": "a805ea1bcafe6595",
                "X-IP-ADDRESS": "172.16.61.2",
                "X-Android-DeviceOS": "5.1.1",
                "X-Android-DeviceName": "SM-G965N",
                "X-Android-Version": "4307",
                "X-App-ID": "com.mathpresso.qanda",
                "User-Agent": "QandaStudent/4307 (com.mathpresso.qanda; OS:22)",
                "Connection": "Keep-Alive"
            },
            body: `formula=${encodeURIComponent(exp)}`

        }, function(e, r, b) {

            if (e) throw new Error("검색하지 못했습니다.");

            var id = JSON.parse(b).id;

            request.get({
                url: `https://api-gateway.qanda.ai/api/v3/question/input_formula/${id}/?version=2&editor_version=2`,
                headers: {
                    "Authorization": "Token 78e41643473b64388bfaa664485ec0a50069d994",
                    "Accept-Language": "ko",
                    "X-Service-Locale": "ko_KR",
                    "X-Jarvis-Config": "prod",
                    "Content-Type": "charset=utf-8",
                    "X-AP-MAC": "7085C2809FCE",
                    "X-Android-DeviceID": "a805ea1bcafe6595",
                    "X-IP-ADDRESS": "172.16.61.2",
                    "X-Android-DeviceOS": "5.1.1",
                    "X-Android-DeviceName": "SM-G965N",
                    "X-Android-Version": "4307",
                    "X-App-ID": "com.mathpresso.qanda",
                    "User-Agent": "QandaStudent/4307 (com.mathpresso.qanda; OS:22)",
                    "Connection": "Keep-Alive"
                }

            }, function(e, r, b2) {

                    var info = JSON.parse(b2)
                    if(info.results==null) throw new Error("계산하지 못했습니다.");
                    info = info.results[0].actions[0];

                    var result = {};
                    try {
                        result.title = info.action_data.prob_title;
                        result.problem = info.action_data.problem.removeSymbol();
                        result.solution = info.action_data.solutions[0].answer.removeSymbol();

                        var steps = [];
                        info.action_data.solutions[0].steps.forEach(o => steps.push(o.description.detail.removeSymbol(true)))
                        result.steps = steps;
                    } catch (e) {
                        throw new Error("계산도중 실패하였습니다.");
                    }
                    resolve(result)
            });
        });
    });
}
