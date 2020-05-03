
/* Vocabulary:
    - counterparty: Bank who issues product
    - start_level: Percentage of underlying at start which is considered for receiving return, may be 90%, 100%, 110% etc.
    - end_level: Percentage of underlying at maturity
    - participation_rate: The amount of the increase you receive
      ex: participation_rate == 200% with 1% rise in underlying asset means return of 2%

    : Protected Uncapped Growth Product

    For:
    - Investors who expect the underlying to rise during the term
    - For investors who are able to hold the product for the full term

    Risks:
    - Defaulting
    - Inflation Risk (real value of investment over time decreases, products are not injusted for inflation)
    - Reinvestment Risk (can not reinvest until maturity)
    -

     Features:
     - Return feature
      - end_level <= start_level => no return
      - end_level > start_level => receive return depending on how much it appreciated
      - Paid at maturity
     - Capital Protection feature
      - Investors will receive all of their investment at maturity regardless
      - There may be exceptions to receiving capital back (ex defaulting)

     Example:
     Characteristics:
      - Original Investment $10,000
      - Underlying Asset: FTSE 100 INDEX
      - Final Maturity: 6 Years
      - Participation Rate: 0.5 times
     If after 6Y FTSE 100 INDEX has increased to double it's value (200%) then investor gets a return of 0.5 * 100% = 50%
     If it instead is below 100% investor gets no return.

    Variations:
    - Change start_level
    - Use averaging for a period, example last year

 */
//
// chart = {
//
//     const product = {
//         investment: "FTSE 100 Index",
//         notional: 10000,
//         maturity: 6*12,
//         participationRate: 0.5
//     };
//
//     const data = [
//         {index: 1, value: 1.1},
//         {index: 2, value: 1.09},
//         {index: 3, value: 1.05},
//         {index: 4, value: 1.06},
//         {index: 5, value: 1.03},
//         {index: 6, value: 1.01},
//         {index: 7, value: 1.02},
//         {index: 8, value: 0.99},
//         {index: 9, value: 0.96},
//         {index: 10, value: 0.97},
//         {index: 11, value: 0.96},
//         {index: 12, value: 0.99},
//         {index: 13, value: 1.0},
//         {index: 14, value: 1.12},
//         {index: 15, value: 1.14},
//         {index: 16, value: 1.12},
//         {index: 17, value: 1.09},
//         {index: 18, value: 1.04},
//         {index: 19, value: 1.02},
//         {index: 20, value: 1.04}
//     ];
//
//     const svg = d3.create("svg")
//         .attr("viewBox", [0, 0, width, height]);
//
//     const zx = x.copy(); // x, but with a new domain.
//
//     const line = d3.line()
//         .x(d => zx(d.date))
//         .y(d => y(d.close));
//
//     const path = svg.append("path")
//         .attr("fill", "none")
//         .attr("stroke", "steelblue")
//         .attr("stroke-width", 1.5)
//         .attr("stroke-miterlimit", 1)
//         .attr("d", line(data));
//
//     const gx = svg.append("g")
//         .call(xAxis, zx);
//
//     const gy = svg.append("g")
//         .call(yAxis, y);
//
//     return Object.assign(svg.node(), {
//         update(domain) {
//             const t = svg.transition().duration(750);
//             zx.domain(domain);
//             gx.transition(t).call(xAxis, zx);
//             path.transition(t).attr("d", line(data));
//         }
//     });
// }