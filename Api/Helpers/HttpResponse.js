export default function HttpResponse(status, message, data=null) {
    return {
        status,
        message,
        data
    }
}