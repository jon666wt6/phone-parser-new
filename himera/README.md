# USERBOX
Userbox::Explain.new(p).call
Userbox::FindMfo.new(p).call
Userbox::Export.new(p).call

# HIMERA
p = Phone.where(pochta_status: 'found')

HimeraDataFetchService.process_phones(p)

OpenAiEnrichmentService.process_phones_in_parallel(p)

PassportBatchValidator.new(PhonePassport.validation_api_error).call

CreditRating::OrchestratorService.process_phones(p)

Export::DataService.export_matched_phone_passports_today
