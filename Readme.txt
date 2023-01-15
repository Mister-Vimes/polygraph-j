POLYGRAPH-J

Copyright (c) 2023, Will Neely

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

=== 0. CONTENTS === [con]

0. CONTENTS [con]
1. ABOUT [abo]
2. HOW TO USE [how]
    a. MAIN CONTROLS [mai]
    b. LAYER OPTIONS [lay]
    c. CATEGORY OPTIONS [cat]

=== 1. ABOUT === [abo]

Polygraph-J is a browser-run generator and exporter of data visualizations involving the combination of a pie chart with an overlayed "splash" graph to visually demonstrate the distribution of multiple data sets among the different pie slices.

For a visual example, look at the included example.jpeg.

=== 2. HOW TO USE === [how]

Everything is labelled for ease of use. There is no need to update or refresh the view; the graph will update to match the user's input.

-- a. MAIN CONTROLS -- [mai]

The Export button will allow the user save the generated graph as an image.

Graph Title is the displayed graph title.

Maximum Value is the highest Layer value that will be displayed. The "splash" graph will not display unless this value is set.

Average Value (checkbox) is used for adjusting values to category sizes if raw numbers are provided. If the user's data is already averaged, this should not be checked.

Category Unit Name is the displayed units for the Categories.

Rotation can be used to rotate the graph.

-- b. LAYER OPTIONS -- [lay]

Each Layer name is customizable and will be reflected on the graph.

Each Layer color can be changed by clicking on the colored rectangle directly below the corresponding Layer name.

Blend level will adjust the strength of each Layer when it overlaps with other Layers. This is useful when trying to ensure that every LAyer is maximally visible. Blend level is not true transparency, as each Layer will display at full visibility when not overlapping with other Layers, no matter its Blend level.

Add Layer can be used to add a new Layer to the graph. A maximum of 8 Layers can be displayed at once.

Remove This Layer will delete the Layer and its data from the graph.

-- c. CATEGORY OPTIONS -- [cat]

Each Category name is customizable and will be reflected on the graph.

The Category Size setting will determine the size of the corresponding Category on the graph, as well as its value if the Average Values chackbox is checked.

Each Layer / Category intersection is a new data Node. This is where the user should enter all appropriate data in order to create the graph.