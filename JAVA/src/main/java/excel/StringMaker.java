package excel;

import java.util.Scanner;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;

public class StringMaker {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        StringBuilder inputBuilder = new StringBuilder();

        System.out.println("여러 줄의 문자열을 입력하세요. 입력을 마치려면 빈 줄을 입력하세요:");

        // 여러 줄 입력 받기
        while (true) {
            String line = scanner.nextLine();
            if (line.isEmpty()) {
                break;
            }
            inputBuilder.append(line).append("\n");
        }

        String input = inputBuilder.toString().trim();
        scanner.close();

        // 각 줄을 큰 따옴표로 감싸고, 쉼표로 구분하여 한 줄로 변환
        List<String> menuNames = Arrays.asList(input.split("\n"));
        String result = menuNames.stream()
                .map(name -> "\"" + name + "\"")
                .collect(Collectors.joining(", "));

        System.out.println(result);
    }
}
