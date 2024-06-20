import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveSlots from '@salesforce/apex/AppointmentController.getActiveSlots';
import saveAppointment from '@salesforce/apex/AppointmentController.saveAppointment';
import checkAppointmentAvailability from '@salesforce/apex/AppointmentController.checkAppointmentAvailability';

export default class AppointmentForm extends LightningElement {
    @track customerName = '';
    @track customerEmail = '';
    @track contact = '';
    @track subject = '';
    @track description = '';
    @track appointmentDate = '';
    @track appointmentTime = '';
    @track availabilityMessage = '';
    @track isSaveDisabled = true;

    appointment = {
        customerName: undefined,
        customerEmail: undefined,
        contact: undefined,
        subject: undefined,
        description: undefined,
        appointmentDate: undefined,
        appointmentTime: undefined,
    };

    @wire(getActiveSlots)
    wiredSlots({ error, data }) {
        if (data) {
            this.slotOptions = data.map(slot => {
                return { startTime: slot.Start_Time__c, endTime: slot.End_Time__c };
            });

            console.log(JSON.stringify(this.slotOptions));
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

    handleInputChange(event) {

        const field = event.target.dataset.id;
        if (field === 'customerName') {
            this.customerName = event.target.value;
        } else if (field === 'customerEmail') {
            this.customerEmail = event.target.value;
        } else if (field === 'contact') {
            this.contact = event.target.value;
        } else if (field === 'description') {
            this.description = event.target.value;
        } else if (field === 'subject') {
            this.subject = event.target.value;
        }
        this.appointment[field] = event.target.value;

        if (field === 'contact') {
            this.appointment[field] = event.detail.recordId;
        }
    }

    handleDateChange(event) {
        this.appointment.appointmentDate = event.target.value;
        console.log(this.appointmentDate);
    }

    handleTimeChange(event) {
        this.appointment.appointmentTime = event.target.value;
        console.log(this.appointmentTime);
    }

    checkAvailability() {

        if (!this.appointment.appointmentDate || !this.appointment.appointmentTime) {
            this.showToast('Error', 'Please select both date and time.', 'error');
            return;
        }

        checkAppointmentAvailability({ datePick: this.appointment.appointmentDate, timePick: this.appointment.appointmentTime })
            .then(result => {
                console.log(result);
                if (result.Boolean) {
                    this.availabilityMessage = 'The selected date and time are available.';
                    this.isSaveDisabled = false;
                } else {
                    this.showToast('Error', result.Note, 'error');

                    this.isSaveDisabled = true;
                }
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    convertTimeStringToMilliseconds(timeString) {
        let [hours, minutes, secondsAndMilliseconds] = timeString.split(':');
        let [seconds, milliseconds] = secondsAndMilliseconds.split('.');

        let totalMilliseconds =
            (parseInt(hours) * 60 * 60 * 1000) +
            (parseInt(minutes) * 60 * 1000) +
            (parseInt(seconds) * 1000) +
            parseInt(milliseconds);

        return totalMilliseconds;
    }

    handleSave() {

        for (const property in this.appointment) {
            console.log(this.appointment[property]);
            if (!this.appointment[property]) {
                this.showToast('Error', 'All Fields Are Required', 'error');
            }
        }

        saveAppointment({ appointmentString: JSON.stringify(this.appointment) })
            .then(() => {
                this.showToast('Success', 'Appointment booked successfully!', 'success');
                this.clearForm();
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    clearForm() {
        this.customerName = '';
        this.customerEmail = '';
        this.contact = '';
        this.subject = '';
        this.description = '';
        this.appointmentDate = '';
        this.appointmentTime = '';
        this.availabilityMessage = '';
        this.isSaveDisabled = true;
    }
}
