package com.carbonflow;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.web.ServletTestExecutionListener;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@TestExecutionListeners(listeners = {
    ServletTestExecutionListener.class,
    DependencyInjectionTestExecutionListener.class
})
class CarbonFlowApplicationTests {

    @Test
    void contextLoads() {
        assertTrue(true);
    }
}
