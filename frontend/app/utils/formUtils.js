export function jsonToFormData(json){
    let formData = new FormData();
    formData.append('obj', JSON.stringify(json));
    return formData
}

export function formDataToJson(formData){
    return JSON.parse(formData.get('obj'));
}