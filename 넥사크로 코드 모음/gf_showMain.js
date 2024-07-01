gf_showMain = function (
    strMenuId,              // 선택한 메뉴의 ID
    objArgs,                // 선택한 메뉴의 URL
    options                 // {'opened':'focus'}
) {
    options = NXCore.setDefaults(options, { opened: 'focus' });

    // 1) 메뉴 찾기 (SEQ_KEY_PGRM = SUB2_T 테이블의 MAIN_ID||SUB1_ID||SUB2_ID / 8길이)
    var nMenuRow = application.gds_menu.findRow("SEQ_KEY_PGRM", strMenuId);
    if (nMenuRow == -1) {
        return NXCore.alert("메뉴가 존재하지 않습니다. {}", strMenuId, null, "error");
    }
    // 2) Screen 정보 찾기
    var frameData = {};
    frameData[CC_FORM_WINID] = "WIN" + application.gds_menu.getColumn(nMenuRow, "SEQ_KEY_PGRM");
    frameData[CC_FORM_URL] = application.gds_menu.getColumn(nMenuRow, "SCRN_URL");
    frameData[CC_FORM_TITLE] = application.gds_menu.getColumn(nMenuRow, "MENU_NM_KR");
    frameData[CC_FORM_MENUID] = application.gds_menu.getColumn(nMenuRow, "SEQ_KEY_PGRM");
    frameData[CC_FORM_MENU_NAVI] = application.gds_menu.getColumn(nMenuRow, "MENU_NAVI");

    if (NXCore.isSupport(NXCore.MDI) && NXCore.getFrame("workframe")) {
        var findFrame = NXCore.getFrame("workframe").frames[frameData[CC_FORM_WINID]];
        if (findFrame != null) {
            try {
                // 전달된 파라메타 재 설정
                NXCore.setArgument(findFrame, frameData);
                NXCore.setArgument(findFrame, objArgs);
                if (options.opened == "focus") {
                    findFrame.form.setFocus();
                } else {
                    // 2018.04.18 KSM
                    //findFrame.form.div_work.ff_load(findFrame.form);
                    findFrame.form.div_base.div_work.ff_load(findFrame.form);
                }
                NXCore.getFrame("tabframe").form.ff_MDIOnactivate(findFrame.form);
            } catch (err) {
                logger.debug(err.message);
            }

            return null;
        }

        var newFrame = new ChildFrame();
        newFrame.init(frameData[CC_FORM_WINID], 0, 0, -1, -1);
        newFrame.set_formurl("frame::FRMWRKM01.xfdl");
        newFrame.set_autosize(false);
        newFrame.set_showtitlebar(false);
        newFrame.set_resizable(true);
        newFrame.set_scrollbars("none");
        newFrame.style.set_border("0 solid #1f3253");
        newFrame.style.set_bordertype("normal 0 0");
        newFrame.set_dragmovetype("normal");
        newFrame.set_showcascadetitletext(false);
        newFrame.style.set_background('white');
        newFrame.set_openstatus("maximize");
        newFrame.set_titletext(frameData[CC_FORM_TITLE]);

        // 공통 Arguments 추가
        NXCore.clearArgument(newFrame);
        NXCore.setArgument(newFrame, frameData);
        // 사용자 Arguments 추가
        NXCore.setArgument(newFrame, objArgs);
        NXCore.getFrame("workframe").addChild(frameData[CC_FORM_WINID], newFrame);
        newFrame.show();
    }
}
