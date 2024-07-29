gf_get_junpyo = function (obj_date, obj_jpgu, obj_length, obj_companycode) {
    var vs_companycode;
    if (NXCore.isEmpty(obj_companycode) || obj_length == null)
        vs_companycode = application.gvs_companycode;
    else
        vs_companycode = obj_companycode;


    var vs_return = this.gf_Procedure_sync("SP_GET_JUNPYO", vs_companycode + "|" + obj_date + "|" + obj_jpgu, "PROCEDURE_SP_GET_JUNPYO", "_ff_Msg_Callback", 0);
    if (gvi_ErrorCode < 0) return null;

    var vn_lenghth;

    if (NXCore.isEmpty(obj_length) || obj_length < 1 || obj_length > 5)
        vn_lenghth = 4;
    else
        vn_lenghth = obj_length;

    return this.gf_NumToStr(vs_return, vn_lenghth);
} 