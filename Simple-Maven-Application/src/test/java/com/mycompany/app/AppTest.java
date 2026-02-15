package com.mycompany.app;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 * Unit test for simple App.
 */
public class AppTest 
{
    @Test
    public void testGetMessage()
    {
        App myApp = new App();
        assertEquals("Hello World", myApp.getMessage());
    }
}
