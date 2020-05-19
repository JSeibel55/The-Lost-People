# 20_g575_MissingPersonsViz

### TeamMembers

* Josh Seibel
* Christopher Pierson
* Hayley Corson-Dosch

### Definitions
* **Missing Person:** A person who has disappeared and may be alive or deceased. 
* **Unidentified Person:** A deceased person whose legal identity is unknown (Jane or John Doe).
* **Unclaimed Person:** A deceased person with a known name, but with no known next of kin, or family member, who could claim the deceased's body for burial or disposal.

### Default Map View 

* State-level proportional symbols with total counts of persons from all three databases. Users can click on the proportional symbol to see a pop-up that identifies the number of cases per database. This view would be used not only to avoid having a default map view with no data, but also to avoid having to prioritize one database over the other two by selecting one for the default view. 

### Final Project
1. **Target User Profile (Persona)**
      * **Person 1:** Public user interested in missing persons
      * **Name:** John Doe
      * **Background Description:** John Doe is a 35-year-old taxi driver. When he was 13, his 17-year-old cousin Anabelle went missing from Albuquerque, New Mexico, her hometown. The local police department received a few tips suggesting that she had been seen in nearby Santa Fe, but she was never found. The loss of Anabelle greatly affected John and his family, and since that time John has been interested in cases of missing people. 
      
         Over the years he has used sites such as NamUs.gov to track and query data about missing people - where he can **_filter_** the data by factors the he feels are important, such as age, race/ethnicity, location last seen, and number of years that the person has been missing. However, he finds it hard to **_visualize_** the spatial distribution of missing cases, because all the data are stored in tabular format, and the available map cannot be interactively filtered, and poorly displays the data.
         
         He would like to be able to visualize the data at different scales – state, county, and by city. He would like to be able to **_filter_** the data that is displayed by age, race/ethnicity, number of years missing, and other attributes. He would also like to be able to **_search_** for individuals using their given name, the case number, or the location (state, county, or city) where they were last seen. He then wants to be able to click on a given enumeration unit (state, county, or city) and **_retrieve_** in a pop-up the total number of cases matching his **_filter_** attributes. 
         
         _[STRETCH/EVOLVING GOAL?] By clicking a button to view case information, he would also like to be able to access a table that would_ **_identify_** _information about the names and characteristics of all the missing people in those cities/counties/states. He would then like to be able to access a specific case file by clicking on a link to the NamUs.gov case page._        
         
2. **User Case Scenarios**
      * **Scenario 1:** This person wants to **_identify_** women who went missing in the city of Philadelphia, Pennsylvania between the age of 18 and 30. Upon arriving at the website, an interested person is presented with splash-screen that includes a description of the data and information about how to use the website (including the need to select one of three databases). At the bottom of the splash-screen is a button that says ‘View Map’.  The user clicks on the ‘View Map’ button. The map loads with its default view. The user sees a pop-up affordance that tells them to start by selecting for which database they wish to view data. The user chooses to display data from the missing persons database. The map automatically updates and displays raw counts of missing people (as proportional symbols) at the state (default) level. The user then sees that there is a **_search_** bar at the top of the screen, where the default option is to **_search_** for a specific place by name. The user clicks on the search bar and types in ‘Philadelphia, Pennsylvania’ and then hits the ‘enter’ button on their keyboard to perform the search. The map automatically zooms to Philadelphia. The map level remains at the state level, but the user uses the left menu bar to change the map level (**_reexpress_**) to city level (this map level can only be accessed beyond a certain map level). The map level is changed to ‘City level’. The map now displays proportional symbols indicating the number of missing people in each city, and is centered on Philadelphia. The user wants to **_filter_** the data to only show missing cases of women between the ages of 18-30. They see that there is a menu tab on the left that says ‘Advanced filters’. They click on this tab, and a dropdown menu appears. They see that under the gender section, the radio button for ‘all’ is selected. They click on the radio button for ‘female’. Under the ‘age at time of disappearance’ section in the filter menu, they enter 18 into the 'From' age box and 30 into the 'To' age box (autocomplete boxes of available ages). The user then clicks the ‘submit’ button at the bottom of the filter menu. The map view resets to only display information about missing women between the ages of 18 to 30. Now that the map is displaying the data that the user is interested in, they click on Philadelphia and a pop up appears with the count of missing people that meet the filter criteria in Philadelphia. _[STRETCH/EVOLVING GOAL] At the same time, a button appears at the bottom that says ‘view case information’. The user wants to_ **_retrieve_** _information for cases that meet their filter criteria in Philadelphia, so they click on this button and the page automatically scrolls down, and the user sees a section with a detailed table for Philadelphia. The table is a list of women who went missing in Philadelphia between the ages of 18 and 30, and includes additional information about those women (age, race/ethnicity, etc.)._     
      
3. **Requirements Document**
    1. **Representations**
        * **Basemap:** outline of the US (state boundaries needed, counties needed, urban area)
        * **Missing/Unclaimed/Unidentified Person Locations:** aggregated to state, county, urban area, etc _[STRETCH GOAL: coordinates as well if web-scraping NAMUS.gov is successful]_.
        * **Legend:** Visual description of the proportional symbols.
        * **Pop-up windows:** Pop-ups will display summary information about the selected bin - e.g., total number of missing people/total number of unclaimed persons. The total will reflect filter criteria, if any have been set.      
        * _[STRETCH/EVOLVING GOAL -- **View Case Information Button:** Scrolls to table with additional information, e.g, list of missing/unidentified/unclaimed persons, additional information, links to outside website]._
        * **Splash-screen:** Documentation on background, data source, and user guidelines.
        
        
    2. **Interactions**
        * **Data Menu** - Filter: object. Change data that is displayed by proportional symbols (Missing Person, Unidentified Person, Unclaimed Person). 
        * **Map Level Menu** - Reexpress: object. Change enumeration unit of data (state, county, or city). The city option is only available beyond a certain zoom level. _[STRETCH GOAL: resymbolize to point map with actual case location (for missing persons: last known location, for unidentified persons: location found, for unclaimed persons: location found)]_. 
        * **Advanced Filter** - Filter: attribute or time. Missing Person: Age when missing, Sex, Ethnicity, When Gone Missing (year and/or month). Unidentified Person: Approximate Age, Sex, Ethnicity, Date Body Found. Unclaimed Person: Age, Sex, Ethnicity, Date Body Found. 
        * **Search By** - Search: location. By Place (state, county, or city). _[STRETCH GOAL: By individual (name or case number)]._ 
        * **Pan** - Scroll around map with mouse. 
        * **Zoom** - Zoom into a location with mouse or buttons on side. 
        * **Proportional Symbol Click** – Retrieve: object. Click on proportional symbol to display an pop-up window (see above for pop-up content). _[STRETCH GOAL: This would also trigger the appearance of a ‘View case information’ button at the bottom of a page that, when clicked, scrolls to this additional information]._
        * _[STRETCH GOAL: **View Case Information button** – When a proportional symbol for an enumeration unit is selected, click on this button to scroll to additional information about missing/unclaimed/unidentified persons in the selected enumeration unit]._
        * _[STRETCH GOAL: **Share** - Export: attributes. Export csv of cases after enumerations were clicked and/or filters implemented]_. 
        * _[STRETCH GOAL: **Census Data** - Overlay: object. General demographic info]_. 

4. Wireframes
    * See folder in repository.
