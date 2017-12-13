define(['knockout', 'text!./metadata.html', 'appConfig', 'webapi/AuthAPI', 'faceted-datatable'], function (ko, view, config, authApi) {
    function metadata(params) {
		var self = this;
        self.reference = ko.observableArray();
        self.selectedItem = ko.observable();
        
        self.conceptId = ko.observable();
        self.conceptName = ko.observable();
        self.valueAsString = ko.observable();
        self.valueAsValue = ko.observable();
        self.valueAsConceptId = ko.observable();
        self.eventDate = ko.observable();
        
        self.loading = ko.observable(false);
		self.config = config;
        self.selectedReport = ko.observable('none');
        self.loading(false);
        
        self.sources = config.api.sources.filter(function(s) { return s.hasResults});
        self.currentSource = ko.observable(self.sources[0]);
        
        self.metadataTypes = [
            {
				name: "Achilles Heel",
				typeKey: "heel"
            },
            {
                name: "Domain",
                typeKey: 1
            },
            {
                name: "Source",
                typeKey: "source"
            }
        ];
        
        self.columns = [
            {
                title: 'Id',
                data: 'metadata_id'
            },
            {
                title: 'Concept Id',
                data: 'metadata_concept_id'
            },
            {
                title: 'Name',
                data: 'metadata_name'
            },
            {
                title: 'Value as Concept',
                data: 'value_as_concept_id'
            },
            {
                title: 'Value as String',
                data: 'value_as_string'
            },
            {
                title: 'Value as Value',
                data: 'value_as_value'
            },
            {
                title: 'Created',
                render: function (s, p, d) {
                    return new Date(d.metadata_datetime)
                        .toLocaleDateString();
                }
            }
        ];

        self.viewDataSource = function () {
            var currentSource = self.currentSource();
            url = '#/datasources/' + currentSource.sourceKey + '/dashboard';
            window.location.replace(url);
        }
        
        self.insertNewAnnotation = function () {
            self.selectedReport('insert');  
            self.selectedItem(null);
            self.clearFields();
        }
        
        self.clearFields = function () {
            self.conceptId('');
            self.conceptName('');
            self.valueAsString('');
            self.valueAsValue('');
            self.valueAsConceptId('');
            self.eventDate('');
        }
        
        self.rowClick = function (d) {
            self.selectedItem(d);
            self.conceptId(d.metadata_concept_id);
            self.conceptName(d.metadata_name);
            self.valueAsString(d.value_as_string);
            self.valueAsValue(d.value_as_value);
            self.valueAsConceptId(d.value_as_concept_id);
            self.eventDate(d.metadata_date);
            self.selectedReport('edit');    
        }
        
        self.submitAnnotation = function () {
            var currentSource = self.currentSource();
            var currentType = self.currentType();
            var hook = 'save';
            var annotation = {};
            annotation.metadata_type_concept_id = currentType.typeKey;
            annotation.metadata_concept_id = self.conceptId();
            annotation.metadata_name = self.conceptName();
            annotation.value_as_string = self.valueAsString();
            annotation.value_as_concept_id = self.valueAsConceptId();
            annotation.value_as_value = self.valueAsValue();
            annotation.metadata_date = self.eventDate();
            
            if (self.selectedItem() != null) {
                hook = 'update/' + self.selectedItem().metadata_id;
            }
            
            self.loading(true);
            $.ajax({
                url: config.api.url + 'annotation/' + currentSource.sourceKey + '/' + hook,
                data: JSON.stringify(annotation),
                method: 'PUT',
                contentType: 'application/json',
                error: function(error) {
                    //self.hasError(true);
                    console.log(error);  
                },
                success: function (d) {
                    self.loadMetadata();
                },
                complete: function () {
                    self.loading(false);
                }
            });
        }
        
        
        self.renderAnnotationLink = function (s, p, d) {
            return '<span class="linkish">' + d.metadata_name + '</span>';
        }
        
        self.currentType = ko.observable(self.metadataTypes[0]);        

        self.loadMetadata = function () {
            self.selectedReport('none');
            self.loading(true);
            
            var currentType = self.currentType();
			var currentSource = self.currentSource();
            
            $.ajax({
                url: config.api.url + 'annotation/' + currentSource.sourceKey + '/get/typeConceptId/' + currentType.typeKey,
                headers: {
                    Authorization: authApi.getAuthorizationHeader()
                },
                method: 'GET',
                error: function(error) {
                    //self.hasError(true);
                    console.log(error);  
                },
                success: function (d) {
                    self.reference(d);
                },
                complete: function () {
                    self.loading(false);
                }
            });
        }
     
        //
        // Subscriptions
        //

        self.currentType.subscribe(self.loadMetadata);
        self.currentSource.subscribe(self.loadMetadata);
        
        self.insertAnnotation = function(d) {
            
        }
    }
    
    var component = {
		viewModel: metadata,
		template: view
	};
    
	ko.components.register('metadata', component);
	return component;
});