public class AppointmentController {
    @AuraEnabled(cacheable=true)
    public static List<Appointment_Slots__c> getActiveSlots() {
        return [SELECT Id, Start_Time__c, End_Time__c FROM Appointment_Slots__c WHERE isActive__c = TRUE];
    }
    
    @AuraEnabled
    public static void saveAppointment(String appointmentString) {
        
        Map<String,Object> appointmentObject = (Map<String,Object>) JSON.deserializeUntyped(appointmentString);
        
        Appointment_Details__c appointment = new Appointment_Details__c();
        
        System.debug(appointmentObject);
        
        appointment.Appointment_Date__c = Date.valueOf((String) appointmentObject?.get('appointmentDate'));
        
        String timePick = (String) appointmentObject?.get('appointmentTime');
        
        List<String> dateTimeArray = timePick.split(':');
        
        List<String> secondAndMiliSecond = dateTimeArray[2].split('\\.');
        
        system.debug(dateTimeArray);
        
        system.debug(secondAndMiliSecond);
        
        Time timePickTime = Time.newInstance(Integer.valueOf(dateTimeArray[0]), Integer.valueOf(dateTimeArray[1]), Integer.valueOf(secondAndMiliSecond[0]), Integer.valueOf(secondAndMiliSecond[1]));
        
        appointment.Appointment_Time__c = timePickTime;
        appointment.Contact__c = (String) appointmentObject?.get('contact');
        appointment.Description__c = (String) appointmentObject?.get('description');
        appointment.Subject__c = (String) appointmentObject?.get('subject');
        insert appointment;
    }
    
    @AuraEnabled
    public static Map<String,Object> checkAppointmentAvailability(String datePick, String timePick) {
        
        Date datePickDate = Date.valueOf(datePick);
        
        List<String> dateTimeArray = timePick.split(':');
        
        List<String> secondAndMiliSecond = dateTimeArray[2].split('\\.');
        
        Time timePickTime = Time.newInstance(Integer.valueOf(dateTimeArray[0]), Integer.valueOf(dateTimeArray[1]), Integer.valueOf(secondAndMiliSecond[0]), Integer.valueOf(secondAndMiliSecond[1]));
        
        List<Appointment_Slots__c> slots = [SELECT Id, Start_Time__c, End_Time__c FROM Appointment_Slots__c WHERE isActive__c = TRUE AND (Start_Time__c <=: timePickTime AND End_Time__c >=: timePickTime) AND Appointment_Date__c =: datePickDate];
        
        system.debug(timePickTime);
        system.debug(datePickDate);
        
        Map<String,Object> returnMap = new Map<String,Object>();
        
        if(slots.isEmpty()){
            returnMap.put('Note','Slot Not Available');
            returnMap.put('Boolean',FALSE);
            System.debug('Slot Not Available');
            return returnMap;
        }
        
        System.debug('Working');
        
        List<Appointment_Details__c> appointments = [
            SELECT Id, Subject__c, Description__c, Contact__c FROM Appointment_Details__c
            WHERE Appointment_Date__c = :datePickDate 
            AND Appointment_Time__c = :timePickTime
        ];
        
        if(appointments.isEmpty()){
            System.debug('appointment Not Available');
        }
        
        returnMap = new Map<String,Object>();
        
        returnMap.put('Note','Appointment Not Available');
        returnMap.put('Boolean',appointments.isEmpty());
        
        return returnMap;
        
    }
}
