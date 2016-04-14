var data;

var margin = { top: 0, right: 0, bottom: 0, left: 0},
    width = 1100 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var colors = {
    author: '#5c132c',
    domain: 'rgb(43, 169, 191)',
    post: '#3d6f3e'
};

var force = d3.layout.force()
    .charge(-80)
    .linkDistance(40)
    .size([width, height])

var chart = d3.select('.chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('class', 'container')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var div = d3.select('body')
    .append('div')
    .attr('class', 'info')
    .style('opacity', 0)

d3.json('campernews.json', function(error, json) {
    if (error) return console.warn(error);

    data = json;
    var authors = [];
    var posts = [];
    var domains = [];

    // populate authors, domains, and posts
    json.forEach(function(element) {
        // collect individual authors
        var author = {
            type: 'author',
            picture: element.author.picture,
            name: element.author.username
            }
        var authorDuplicate = false;
        authors.forEach(function(e) {
            if (e.name == author.name) {
                authorDuplicate = true;
                return;
            }
        })
        if (!authorDuplicate) {
            authors.push(author)
        }

        // collect domains
        var domain = element.link.replace(/\S*\/\//, '').replace(/\/\S*/, '');
        var domainDuplicate = false;
        domains.forEach(function(e) {
            if (e.name == domain) {
                domainDuplicate = true;
            }
        })
        if (!domainDuplicate) {
            domains.push({
                name: domain,
                type: 'domain'
            })
        }

        // collect posts
        posts.push({
            type: 'post',
            link: element.link,
            headline: element.headline,
            date: element.timePosted,
            description: element.metaDescription,
            domain: domain,
            author: element.author.username
        })
    })

    // set data structure for graph
    var links = [];
    var nodes = authors.concat(posts).concat(domains);

    // populate links
    authors.forEach(function(e, i) {
        var name = e.name;
        for (var j = 0; j < posts.length; j++) {
            if (name == posts[j].author) {
                links.push({
                    name: posts[j].headline,
                    source: i,
                    target: j + authors.length
                })
            }
        }
    })

    domains.forEach(function(e, i) {
        var name = e.name;
        for (var j = 0; j < posts.length; j++) {
            if (name == posts[j].domain) {
                links.push({
                    name: name,
                    source: i + authors.length + posts.length,
                    target: j + authors.length
                })
            }
        }
    })

    force
        .nodes(nodes)
        .links(links)
        .start();

    var link = chart.selectAll('.link')
        .data(links)
      .enter().append('line')
        .attr('class', 'link')

    var chooseNode = function(d) {
        if (d.type === 'author') {
            return 'img'
        }
        else {
            return 'circle'
        }
    }

    // TODO set appended element to IMG for authors and CIRCLE for domains/posts
    var node = chart.selectAll('.node')
        .data(nodes)
      .enter().append('circle')
        .attr('class', function(d) { return 'node ' + d.type })
        .attr('r', function(d) {
            return Math.max(7, d.weight * 2)
        })
        .style('fill', function(d) {
            return colors[d.type]
        })
        .on('mouseover', function(d) {
            div .style('opacity', 1)
                .style('left', d3.event.pageX + 'px')
                .style('top', d3.event.pageY + 'px');
            div .html(function() {
                var text;
                if (d.type === 'domain') {
                    text = '<strong>' + d.name + '</strong><br>'
                } else if (d.type === 'author') {
                    text = '<strong>' + d.name + '</strong><br><img class = "userphoto" src="' + d.picture + '">'
                } else if (d.type === 'post') {
                    text = '<strong>' + d.headline + '</strong><br>' + d.domain + '<p class = "description">' + d.description + '</p>'
                }
                return text;
            })
        })
        .on('mouseout', function(d) {
            div.style('opacity', 0)
        })
        .call(force.drag)

    force.on('tick', function(){
        link.attr('x1', function(d) { return d.source.x })
            .attr('y1', function(d) { return d.source.y })
            .attr('x2', function(d) { return d.target.x })
            .attr('y2', function(d) { return d.target.y })
        node.attr('cx', function(d) { return d.x })
            .attr('cy', function(d) { return d.y })
    })

    var key = d3.select('#key')
    key.append('div')
        .style('background', colors['author'])
        .text('author')
    key.append('div')
        .style('background', colors['post'])
        .text('post')
    key.append('div')
        .style('background', colors['domain'])
        .text('domain')
})
