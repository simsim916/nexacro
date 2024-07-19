출고 등록 시
    - EXPCIH 테이블
        출고 일자의 기준으로 환율(WRATE), 출고확정일자(OUTCFDT) 입력
        - TRI_EXPCIH_BEFORE 트리거 276줄에 따라 원화금액(WAMT) 입력
        - TRI_EXPCIH_AFTER 트리거 320줄에 의해
            EXPCID 원화금액(WAMT) 입력
            ⭐ 추가로 EXPCIH와 EXPCID의 원화금액을 맞추기 위해 EXPCID의 제일 마지막 레코드에 EXPCIH와의 차이만큼 원화금액을 조절함 (350줄)
            IMHIST_SAL 도 동일한 방식으로 작동 (564줄, 654줄) s

수출 면장 등록 시
    - EXPCIH 테이블
        수출 면장 일자로 환율(WRATE), 판매확정일자(SALEDT) 입력
        - TRI_EXPCIH_BEFORE 트리거 276줄 발동안함 (WAMT가 NULL or 0 일때만 원화 금액 입력)
        - TRI_EXPCIH_AFTER 트리거 320줄에 의해
            EXPCID 원화금액(WAMT) 입력 / IMHIST_SAL 도 동일한 방식으로 작동 (564줄, 654줄) 
            ⭐ 추가로 EXPCIH와 EXPCID의 원화금액을 맞추기 위해 EXPCID의 제일 마지막 레코드에 EXPCIH와의 차이만큼 원화금액을 조절함 (350줄)
                => 여기서 에러가 발생 



            